"""
Deep Reinforcement Learning agent with stochastic modeling and enhanced feedback.

Improvements:
1. Stochastic model (μ, σ) - smoother latent space, uncertainty quantification
2. Markovian state - transition probabilities, negative states (failed predictions)
3. Refined reward - guard rail penalties, transfer shortfall
4. Boltzmann exploration - replaces ε-greedy
5. Monte Carlo validation - Ulam-style simulation before final action
6. Warm start - initialize from prior successful states
"""
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from collections import defaultdict
from typing import List, Tuple, Dict, Optional
from utils.data_processor import get_historical_data
from utils.frequency_analysis import get_hot_numbers, get_cold_numbers, get_overdue_numbers
from utils.error_distance_calculator import calculate_all_metrics
from config import Config
import logging
import os

logger = logging.getLogger(__name__)


def _numbers_to_deltas(numbers: List[int]) -> np.ndarray:
    """Convert sorted numbers to delta (spacing) representation."""
    if len(numbers) < 2:
        return np.zeros(5)
    deltas = [numbers[i + 1] - numbers[i] for i in range(len(numbers) - 1)]
    return np.array(deltas, dtype=np.float32) / 60.0


def _get_baseline_best_error(game_type: str, instantdb_client=None) -> float:
    """Get best in-sample error from frequency baseline for transfer shortfall."""
    if instantdb_client is None:
        try:
            from services.instantdb_client import instantdb
            instantdb_client = instantdb
        except ImportError:
            return 100.0
    try:
        results = instantdb_client.get_results(game_type, limit=100)
        if not results:
            return 100.0
        hot = get_hot_numbers(game_type, top_n=6)
        baseline_pred = sorted([n for n, _ in hot[:6]])
        if len(baseline_pred) < 6:
            return 100.0
        errors = []
        for r in results[:20]:
            actual = [r.get(f'number_{i}') for i in range(1, 7)]
            if all(actual):
                metrics = calculate_all_metrics(baseline_pred, actual)
                errors.append(metrics.get('euclidean_distance', 100))
        return min(errors) if errors else 100.0
    except Exception:
        return 100.0


class DRLAgent:
    """
    DRL agent with stochastic modeling, Markovian state, Boltzmann exploration,
    guard rail penalties, transfer shortfall, and Monte Carlo validation.
    """
    
    def __init__(self):
        self.model = None
        self.target_model = None
        self.memory = []
        self.params = Config.DRL_PARAMS
        self.epsilon = self.params['epsilon']
        self.epsilon_decay = self.params['epsilon_decay']
        self.epsilon_min = self.params['epsilon_min']
        self.gamma = self.params['gamma']
        self.temperature = self.params.get('boltzmann_temperature', 1.0)
        self.temp_decay = self.params.get('temperature_decay', 0.98)
        self.temp_min = self.params.get('temperature_min', 0.1)
        self.is_trained = False
        self.trained_game_type = None
        self.markov_transitions = None
        self.sum_min = self.params.get('sum_min', 100)
        self.sum_max = self.params.get('sum_max', 250)
        self.negative_state_vector = None
        self.mc_histogram = None
        
    def _build_model(self, state_size: int, action_size: int, stochastic: bool = True):
        """Build model with optional stochastic (μ, σ) output."""
        use_stoch = stochastic and self.params.get('use_stochastic', True)
        
        inputs = keras.Input(shape=(state_size,))
        x = layers.Dense(64, activation='relu')(inputs)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(64, activation='relu')(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(32, activation='relu')(x)
        
        if use_stoch:
            q_mean = layers.Dense(action_size, activation='linear', name='q_mean')(x)
            q_logvar = layers.Dense(action_size, activation='softplus', name='q_logvar')(x)
            outputs = layers.Concatenate()([q_mean, q_logvar])
            model = keras.Model(inputs=inputs, outputs=outputs)
        else:
            outputs = layers.Dense(action_size, activation='linear')(x)
            model = keras.Model(inputs=inputs, outputs=outputs)
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.params['learning_rate']),
            loss='mse'
        )
        return model
    
    def _get_q_values(self, model, state: np.ndarray, stochastic: bool = False) -> np.ndarray:
        """Get Q-values, with optional sampling from (μ, σ)."""
        out = model.predict(state, verbose=0)
        if self.params.get('use_stochastic', True) and out.shape[1] == 2000:
            q_mean = out[:, :1000]
            q_logvar = out[:, 1000:]
            q_std = np.sqrt(np.exp(np.clip(q_logvar, -10, 10)) + 1e-6)
            if stochastic:
                return q_mean + q_std * np.random.randn(*q_mean.shape).astype(np.float32)
            return q_mean
        return out
    
    def _build_markov_transitions(self, game_type: str) -> Optional[np.ndarray]:
        """Build Markov transition probabilities for sum buckets."""
        df = get_historical_data(game_type, limit=200)
        if df.empty or len(df) < 20:
            return None
        df = df.sort_values('draw_date').reset_index(drop=True)
        n_buckets = self.params.get('markov_sum_buckets', 5)
        sum_range = self.sum_max - self.sum_min
        bucket_size = max(1, sum_range // n_buckets)
        
        transitions = defaultdict(lambda: defaultdict(int))
        prev_bucket = None
        for idx in range(len(df)):
            row = df.iloc[idx]
            s = sum([row[f'number_{i}'] for i in range(1, 7)])
            bucket = min(int((s - self.sum_min) / bucket_size), n_buckets - 1)
            bucket = max(0, bucket)
            if prev_bucket is not None:
                transitions[prev_bucket][bucket] += 1
            prev_bucket = bucket
        
        trans_probs = np.zeros((n_buckets, n_buckets))
        for p, nexts in transitions.items():
            total = sum(nexts.values())
            for n, c in nexts.items():
                trans_probs[p, n] = c / total
        return trans_probs
    
    def _get_state(self, game_type: str, recent_error_distance: float = None,
                   error_history: List[float] = None, failed_predictions: List[List[int]] = None) -> np.ndarray:
        """
        State with: frequency, error, Markovian transitions, negative states, delta features.
        """
        df = get_historical_data(game_type, limit=10)
        max_number = Config.GAMES[game_type]['max_number']
        
        hot_numbers = get_hot_numbers(game_type, top_n=10)
        cold_numbers = get_cold_numbers(game_type, bottom_n=10)
        overdue_numbers = get_overdue_numbers(game_type)[:10]
        
        hot_vector = np.zeros(max_number)
        for num, _ in hot_numbers:
            if 1 <= num <= max_number:
                hot_vector[num - 1] = 1
        
        cold_vector = np.zeros(max_number)
        for num, _ in cold_numbers:
            if 1 <= num <= max_number:
                cold_vector[num - 1] = 1
        
        overdue_vector = np.zeros(max_number)
        for num, _ in overdue_numbers:
            if 1 <= num <= max_number:
                overdue_vector[num - 1] = 1
        
        if not df.empty:
            latest = df.iloc[0]
            recent_numbers = sorted([latest[f'number_{i}'] for i in range(1, 7)])
            recent_vector = np.zeros(max_number)
            for num in recent_numbers:
                if 1 <= num <= max_number:
                    recent_vector[num - 1] = 1
            delta_features = _numbers_to_deltas(recent_numbers)
            latest_sum = sum(recent_numbers)
            latest_product = np.log(np.prod(recent_numbers) + 1) / 25.0
        else:
            recent_vector = np.zeros(max_number)
            delta_features = np.zeros(5)
            latest_sum = (self.sum_min + self.sum_max) / 2
            latest_product = 0.5
        
        max_error = 200
        if recent_error_distance is not None:
            norm_err = min(recent_error_distance / max_error, 1.0)
            if error_history and len(error_history) >= 2:
                recent = error_history[-5:]
                avg_err = np.mean(recent) / max_error
                var_err = min(np.var(recent) / (max_error**2), 1.0)
                trend = (recent[-2] - recent[-1]) / max_error if len(recent) >= 2 else 0
            else:
                avg_err, var_err, trend = 0.5, 0.5, 0.0
            error_features = np.array([norm_err, 1 - norm_err, avg_err, var_err, trend], dtype=np.float32)
        else:
            error_features = np.array([0.5, 0.5, 0.5, 0.5, 0.0], dtype=np.float32)
        
        markov_features = np.zeros(self.params.get('markov_sum_buckets', 5), dtype=np.float32)
        if self.markov_transitions is not None and not df.empty:
            n_buckets = self.markov_transitions.shape[0]
            bucket_size = max(1, (self.sum_max - self.sum_min) // n_buckets)
            prev_bucket = min(int((latest_sum - self.sum_min) / bucket_size), n_buckets - 1)
            prev_bucket = max(0, prev_bucket)
            markov_features = self.markov_transitions[prev_bucket].astype(np.float32)
        
        negative_vector = np.zeros(max_number)
        if failed_predictions:
            for pred in failed_predictions[:2]:
                for num in pred:
                    if 1 <= num <= max_number:
                        negative_vector[num - 1] = 1
        
        norm_sum = (latest_sum - self.sum_min) / max(self.sum_max - self.sum_min, 1)
        norm_sum = np.clip(norm_sum, 0, 1)
        
        state = np.concatenate([
            hot_vector, cold_vector, overdue_vector, recent_vector,
            error_features, markov_features, negative_vector,
            delta_features, np.array([norm_sum, latest_product], dtype=np.float32)
        ])
        return state.astype(np.float32)
    
    def _action_to_numbers(self, action: int, game_type: str) -> List[int]:
        """Convert action index to number selection."""
        max_number = Config.GAMES[game_type]['max_number']
        numbers_count = Config.GAMES[game_type]['numbers_count']
        np.random.seed(action)
        numbers = sorted(np.random.choice(range(1, max_number + 1), size=numbers_count, replace=False))
        return [int(n) for n in numbers]
    
    def _check_guard_rails(self, numbers: List[int]) -> Tuple[bool, float]:
        """Check guard rails: sum range, even/odd balance. Returns (passed, penalty)."""
        penalty = 0.0
        s = sum(numbers)
        if s < self.sum_min or s > self.sum_max:
            penalty += self.params.get('guard_rail_penalty', 50)
        evens = sum(1 for n in numbers if n % 2 == 0)
        if evens == 0 or evens == 6:
            penalty += self.params.get('all_even_odd_penalty', 40)
        return (penalty == 0, penalty)
    
    def _calculate_reward(self, predicted: List[int], actual: List[int],
                         game_type: str, error_distance: float = None,
                         baseline_best_error: float = None) -> float:
        """Reward with guard rail penalties and transfer shortfall."""
        reward_a, reward_b, reward_c = 0.0, 0.0, 0.0
        
        if actual:
            if error_distance is not None:
                euclidean_dist = error_distance
                matches = len(set(predicted) & set(actual))
            else:
                metrics = calculate_all_metrics(predicted, actual)
                euclidean_dist = metrics.get('euclidean_distance', 100)
                matches = metrics.get('set_intersection', 0)
            
            max_err = 200
            norm_err = euclidean_dist / max_err
            error_reward = 200.0 / (1.0 + norm_err * 5)
            match_bonus = matches * 15
            reward_a = error_reward + match_bonus
        
        _, guard_penalty = self._check_guard_rails(predicted)
        reward_a -= guard_penalty
        
        if self.params.get('use_transfer_shortfall', True) and baseline_best_error is not None:
            shortfall = baseline_best_error - euclidean_dist if actual else 0
            if shortfall > 0:
                reward_a += min(shortfall * 0.5, 30)
        
        df = get_historical_data(game_type, limit=100)
        if len(df) >= 30:
            try:
                data = []
                for idx in range(min(len(df), 80)):
                    row = df.iloc[idx]
                    nums = [row[f'number_{i}'] for i in range(1, 7)]
                    data.append([sum(nums), np.prod(nums) if np.prod(nums) < 1e10 else 1e10])
                X = np.array(data)
                pca = PCA(n_components=min(2, len(data) - 1))
                X_pca = pca.fit_transform(X)
                kmeans = KMeans(n_clusters=min(3, len(data) // 10), random_state=42, n_init=3)
                kmeans.fit(X_pca)
                pred_point = pca.transform([[sum(predicted), min(np.prod(predicted), 1e10)]])[0]
                pred_cluster = kmeans.predict([pred_point])[0]
                density = np.sum(kmeans.predict(X_pca) == pred_cluster) / len(X_pca)
                reward_b = density * 20
            except Exception:
                reward_b = 0
        else:
            reward_b = 0
        
        hot_set = set(n for n, _ in get_hot_numbers(game_type, top_n=10))
        cold_set = set(n for n, _ in get_cold_numbers(game_type, bottom_n=10))
        overdue_set = set(n for n, _ in get_overdue_numbers(game_type)[:10])
        pred_set = set(predicted)
        reward_c = len(pred_set & hot_set) * 5 + len(pred_set & overdue_set) * 3 - len(pred_set & cold_set) * 2
        
        return reward_a * 0.85 + reward_b * 0.10 + reward_c * 0.05
    
    def _boltzmann_action(self, q_values: np.ndarray, temperature: float) -> int:
        """Select action via Boltzmann (softmax) exploration."""
        q = q_values[0]
        q_shifted = q - np.max(q)
        exp_q = np.exp(np.clip(q_shifted / max(temperature, 0.01), -50, 50))
        probs = exp_q / exp_q.sum()
        return int(np.random.choice(len(probs), p=probs))
    
    def _build_mc_histogram(self, game_type: str, n_samples: int = 10000) -> Optional[Dict]:
        """Build Monte Carlo histogram for validation."""
        max_number = Config.GAMES[game_type]['max_number']
        sums_count = defaultdict(int)
        for _ in range(n_samples):
            nums = sorted(np.random.choice(range(1, max_number + 1), size=6, replace=False))
            s = sum(nums)
            if self.sum_min <= s <= self.sum_max:
                sums_count[s] += 1
        if not sums_count:
            return None
        total = sum(sums_count.values())
        return {k: v / total for k, v in sums_count.items()}
    
    def _mc_validation_score(self, numbers: List[int], histogram: Dict) -> float:
        """Score prediction by Monte Carlo histogram frequency."""
        s = sum(numbers)
        return histogram.get(s, 0) if histogram else 0.5
    
    def _warm_start_load(self, game_type: str) -> bool:
        """Load warm start weights if available."""
        path = self.params.get('warm_start_path', 'models/drl_warm_start')
        model_path = f"{path}_{game_type}.weights.h5"
        if os.path.exists(model_path) and self.model is not None:
            try:
                self.model.load_weights(model_path)
                self.target_model.set_weights(self.model.get_weights())
                logger.info(f"DRL warm start loaded from {model_path}")
                return True
            except Exception as e:
                logger.debug(f"Warm start load failed: {e}")
        return False
    
    def _warm_start_save(self, game_type: str, reward: float) -> None:
        """Save weights when reward is good (for warm start)."""
        if reward < 80:
            return
        path = self.params.get('warm_start_path', 'models/drl_warm_start')
        base_dir = os.path.dirname(path)
        if base_dir:
            os.makedirs(base_dir, exist_ok=True)
        model_path = f"{path}_{game_type}.weights.h5"
        try:
            self.model.save_weights(model_path)
            logger.info(f"DRL warm start saved to {model_path} (reward={reward:.1f})")
        except Exception as e:
            logger.debug(f"Warm start save failed: {e}")
    
    def train(self, game_type: str, episodes: int = 100) -> None:
        """Train with Boltzmann exploration and stochastic model."""
        df = get_historical_data(game_type)
        if df.empty or len(df) < 20:
            raise ValueError("Insufficient historical data for DRL training")
        
        max_number = Config.GAMES[game_type]['max_number']
        n_buckets = self.params.get('markov_sum_buckets', 5)
        state_size = max_number * 4 + 5 + n_buckets + max_number + 5 + 2
        action_size = 1000
        
        self.markov_transitions = self._build_markov_transitions(game_type)
        if self.markov_transitions is None:
            self.markov_transitions = np.ones((n_buckets, n_buckets)) / n_buckets
        
        self.model = self._build_model(state_size, action_size)
        self.target_model = self._build_model(state_size, action_size)
        self.target_model.set_weights(self.model.get_weights())
        
        if self.params.get('use_warm_start', True):
            self._warm_start_load(game_type)
        
        baseline_error = _get_baseline_best_error(game_type) if self.params.get('use_transfer_shortfall') else None
        
        for episode in range(episodes):
            if episodes <= 5:
                print(f"      DRL training: {episode + 1}/{episodes} episodes...")
            elif episode % 2 == 0 and episode > 0:
                print(f"      DRL training: {episode}/{episodes} episodes...")
            
            state = self._get_state(game_type)
            state_1d = np.array(state).flatten().astype(np.float32)
            state_reshaped = state_1d.reshape(1, -1)
            
            q_values = self._get_q_values(self.model, state_reshaped, stochastic=True)
            action = self._boltzmann_action(q_values, self.temperature)
            
            predicted = self._action_to_numbers(action, game_type)
            actual = None
            if not df.empty:
                latest = df.iloc[0]
                actual = [latest[f'number_{i}'] for i in range(1, 7)]
            
            reward = self._calculate_reward(predicted, actual, game_type, baseline_best_error=baseline_error)
            
            self.memory.append((state_1d, action, reward))
            
            self.temperature = max(self.temp_min, self.temperature * self.temp_decay)
            
            if len(self.memory) >= 16:
                batch_size = min(16, len(self.memory))
                indices = np.random.choice(len(self.memory), size=batch_size, replace=False)
                states_batch = np.stack([self.memory[i][0] for i in indices])
                actions_batch = np.array([self.memory[i][1] for i in indices])
                rewards_batch = np.array([self.memory[i][2] for i in indices])
                
                out = self.model.predict(states_batch, verbose=0)
                if out.shape[1] == 2000:
                    q_mean = out[:, :1000]
                    q_logvar = out[:, 1000:]
                    q_mean[range(batch_size), actions_batch] = rewards_batch
                    q_logvar[range(batch_size), actions_batch] = np.log(0.5)
                    targets = np.concatenate([q_mean, q_logvar], axis=1)
                else:
                    q_values = out.copy()
                    q_values[range(batch_size), actions_batch] = rewards_batch
                    targets = q_values
                
                self.model.fit(states_batch, targets, epochs=1, verbose=0, batch_size=batch_size)
            
            if episode % 10 == 0:
                self.target_model.set_weights(self.model.get_weights())
            
            if episode == episodes - 1 and reward > 80:
                self._warm_start_save(game_type, reward)
        
        self.is_trained = True
        self.trained_game_type = game_type
    
    def predict(self, game_type: str) -> List[int]:
        """Predict with Monte Carlo validation and Boltzmann selection."""
        episodes = max(1, min(int(getattr(Config, 'DRL_PREDICT_EPISODES', 3)), 20))
        if not self.is_trained or self.trained_game_type != game_type:
            self.train(game_type, episodes=episodes)
        
        max_number = Config.GAMES[game_type]['max_number']
        n_buckets = self.params.get('markov_sum_buckets', 5)
        state_size = max_number * 4 + 5 + n_buckets + max_number + 5 + 2
        action_size = 1000
        
        if self.markov_transitions is None:
            self.markov_transitions = self._build_markov_transitions(game_type)
            if self.markov_transitions is None:
                self.markov_transitions = np.ones((n_buckets, n_buckets)) / n_buckets
        
        state = self._get_state(game_type)
        state = state.reshape(1, -1)
        
        q_values = self._get_q_values(self.model, state, stochastic=False)
        
        if self.params.get('use_monte_carlo_validation', True):
            n_top = self.params.get('mc_top_candidates', 10)
            cfg_mc = int(getattr(Config, 'DRL_MC_VALIDATION_SAMPLES', 0) or 0)
            n_samples = cfg_mc if cfg_mc > 0 else int(self.params.get('mc_validation_samples', 5000))
            n_samples = max(500, min(n_samples, 50_000))
            top_actions = np.argsort(q_values[0])[-n_top:][::-1]
            
            if self.mc_histogram is None:
                self.mc_histogram = self._build_mc_histogram(game_type, n_samples)
            
            best_action = top_actions[0]
            best_score = -1
            for action in top_actions:
                numbers = self._action_to_numbers(int(action), game_type)
                mc_score = self._mc_validation_score(numbers, self.mc_histogram or {})
                q_val = q_values[0, action]
                combined = 0.7 * (q_val - q_values[0].min()) / max(q_values[0].max() - q_values[0].min(), 1e-6) + 0.3 * mc_score
                if combined > best_score:
                    best_score = combined
                    best_action = action
            action = best_action
        else:
            action = np.argmax(q_values[0])
        
        return self._action_to_numbers(int(action), game_type)
    
    def learn_from_accuracy_records(self, game_type: str, accuracy_records: List[Dict],
                                    instantdb_client=None) -> None:
        """Learn from accuracy records with negative states and transfer shortfall."""
        if not accuracy_records or len(accuracy_records) < 5:
            return
        
        if instantdb_client is None:
            from services.instantdb_client import instantdb
            instantdb_client = instantdb
        
        try:
            predictions = instantdb_client.get_predictions(game_type, limit=1000)
            results = instantdb_client.get_results(game_type, limit=1000)
            drl_predictions = {p.get('id'): p for p in predictions if p.get('model_type') == 'DRL'}
            
            error_history = []
            for acc in accuracy_records[-100:]:
                ed = acc.get('error_distance')
                if ed is not None:
                    error_history.append(float(ed))
            
            failed_predictions = []
            prioritized = []
            baseline_error = _get_baseline_best_error(game_type, instantdb_client)
            
            for acc in accuracy_records[-100:]:
                pred_id = acc.get('prediction_id')
                if pred_id not in drl_predictions:
                    continue
                pred = drl_predictions[pred_id]
                result = next((r for r in results if r.get('id') == acc.get('result_id')), None)
                if not result:
                    continue
                error_dist = acc.get('error_distance')
                if error_dist is None:
                    continue
                
                predicted = [pred.get(f'predicted_number_{i}') for i in range(1, 7)]
                actual = [result.get(f'number_{i}') for i in range(1, 7)]
                if error_dist > 80:
                    failed_predictions.append(predicted)
                
                state = self._get_state(game_type, recent_error_distance=error_dist,
                                       error_history=error_history, failed_predictions=failed_predictions[-5:])
                state_1d = np.array(state).flatten().astype(np.float32)
                reward = self._calculate_reward(predicted, actual, game_type,
                                               error_distance=error_dist, baseline_best_error=baseline_error)
                weight = 1.0 / (1.0 + error_dist)
                prioritized.append((state_1d, reward, weight, error_dist))
            
            prioritized.sort(key=lambda x: x[3])
            if len(prioritized) < 5:
                return
            
            weights = np.array([r[2] for r in prioritized])
            weights = weights / weights.sum()
            n_use = min(max(50, len(prioritized)), len(prioritized))
            if len(prioritized) <= 50:
                selected = prioritized
            else:
                top = prioritized[:30]
                rem = prioritized[30:]
                idx = np.random.choice(len(rem), size=min(20, len(rem)), replace=False, p=weights[30:] / weights[30:].sum())
                selected = top + [rem[i] for i in idx]
            
            learning_data = [(s, r) for s, r, _, _ in selected]
            
            max_number = Config.GAMES[game_type]['max_number']
            n_buckets = self.params.get('markov_sum_buckets', 5)
            state_size = max_number * 4 + 5 + n_buckets + max_number + 5 + 2
            action_size = 1000
            
            if self.model is None:
                self.model = self._build_model(state_size, action_size)
                self.target_model = self._build_model(state_size, action_size)
                self.target_model.set_weights(self.model.get_weights())
                if self.params.get('use_warm_start', True):
                    self._warm_start_load(game_type)
            
            states_batch = np.stack([d[0] for d in learning_data])
            rewards_batch = np.array([d[1] for d in learning_data])
            avg_error = np.mean([r[3] for r in selected])
            
            out = self.model.predict(states_batch, verbose=0)
            if out.shape[1] == 2000:
                q_mean = out[:, :1000]
                q_logvar = out[:, 1000:]
                best_actions = np.argmax(q_mean, axis=1)
                alpha = 0.3 + 0.4 * min(avg_error / 200, 1)
                new_q = alpha * rewards_batch + (1 - alpha) * q_mean[range(len(learning_data)), best_actions]
                q_mean[range(len(learning_data)), best_actions] = new_q
                targets = np.concatenate([q_mean, q_logvar], axis=1)
            else:
                q_values = out.copy()
                best_actions = np.argmax(q_values, axis=1)
                alpha = 0.3 + 0.4 * min(avg_error / 200, 1)
                new_q = alpha * rewards_batch + (1 - alpha) * q_values[range(len(learning_data)), best_actions]
                q_values[range(len(learning_data)), best_actions] = new_q
                targets = q_values
            
            epochs = min(3, max(1, len(learning_data) // 10))
            self.model.fit(states_batch, targets, epochs=epochs, verbose=0,
                          batch_size=min(16, len(learning_data)),
                          validation_split=0.1 if len(learning_data) > 10 else 0)
            
            if len(learning_data) >= 10:
                self.target_model.set_weights(self.model.get_weights())
            
            logger.info(f"DRL updated with {len(learning_data)} records, avg_error={avg_error:.2f}")
            
        except Exception as e:
            logger.warning(f"DRL learn_from_accuracy_records failed: {e}")
