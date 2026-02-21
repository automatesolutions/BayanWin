"""
Decision Tree/Random Forest with structured features, clustering, and Monte Carlo prediction.

Improvements:
1. Stochastic/probabilistic - ensemble variance for uncertainty
2. Structured features - Delta system, Markovian transitions
3. K-Means clustering - specialized local models per draw "type"
4. Monte Carlo (Ulam) prediction - large-scale simulation with guard rails
5. Guard rails - sum 100-250 filter
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from collections import defaultdict
from typing import List, Tuple, Dict, Optional
from utils.data_processor import get_historical_data
from utils.frequency_analysis import calculate_frequency
from config import Config


def _numbers_to_deltas(numbers: List[int]) -> np.ndarray:
    """Convert sorted numbers to delta (spacing) representation."""
    if len(numbers) < 2:
        return np.zeros(5)
    deltas = [numbers[i + 1] - numbers[i] for i in range(len(numbers) - 1)]
    return np.array(deltas, dtype=np.float32) / 60.0


def _get_row_numbers(row) -> List[int]:
    """Extract sorted numbers from a dataframe row."""
    return sorted([
        int(row['number_1']), int(row['number_2']), int(row['number_3']),
        int(row['number_4']), int(row['number_5']), int(row['number_6'])
    ])


class DecisionTreeModel:
    """
    Random Forest with structured features, K-Means local models, and Monte Carlo prediction.
    """
    
    def __init__(self):
        self.models = None
        self.kmeans = None
        self.pca = None
        self.transition_matrix = None
        self.sum_min = None
        self.sum_max = None
        self.cluster_centers_ = None
        self.feature_size = None
        self.is_trained = False
        self.trained_game_type = None
        self.params = Config.DECISION_TREE_PARAMS
        self.max_number = None
        
    def _build_features(self, prev_numbers: List[int], frequency: Dict,
                        markov_probs: Optional[np.ndarray] = None,
                        max_number: int = 58) -> np.ndarray:
        """Build feature vector with Delta, Markovian, and statistical regularities."""
        freq_features = [frequency.get(i, 0) for i in range(1, max_number + 1)]
        prev_features = prev_numbers + [0] * (6 - len(prev_numbers))
        
        stat_features = [
            sum(prev_numbers),
            np.mean(prev_numbers),
            np.std(prev_numbers) if len(prev_numbers) > 1 else 0,
            max(prev_numbers),
            min(prev_numbers)
        ]
        
        delta_features = _numbers_to_deltas(prev_numbers)
        
        if markov_probs is not None:
            markov_features = markov_probs.astype(np.float32)
        else:
            n_buckets = self.params.get('markov_sum_buckets', 5)
            markov_features = np.ones(n_buckets, dtype=np.float32) / n_buckets
        
        return np.concatenate([
            np.array(freq_features, dtype=np.float32),
            np.array(prev_features, dtype=np.float32),
            np.array(stat_features, dtype=np.float32),
            delta_features,
            markov_features
        ])
    
    def _build_markov_transitions(self, df, max_number: int) -> Tuple[Dict, np.ndarray]:
        """Build Markov transition matrix: sum_bucket -> next sum_bucket probabilities."""
        n_buckets = self.params.get('markov_sum_buckets', 5)
        sum_min = self.sum_min or 100
        sum_max = self.sum_max or 250
        bucket_size = max(1, (sum_max - sum_min) // n_buckets)
        
        transitions = defaultdict(lambda: defaultdict(int))
        prev_bucket = None
        
        for idx in range(len(df) - 1):
            row = df.iloc[idx]
            numbers = _get_row_numbers(row)
            s = sum(numbers)
            bucket = min(int((s - sum_min) / bucket_size), n_buckets - 1)
            bucket = max(0, bucket)
            if prev_bucket is not None:
                transitions[prev_bucket][bucket] += 1
            prev_bucket = bucket
        
        trans_matrix = np.zeros((n_buckets, n_buckets))
        for p, nexts in transitions.items():
            total = sum(nexts.values())
            for n, c in nexts.items():
                trans_matrix[p, n] = c / total
        
        return transitions, trans_matrix
    
    def _get_markov_probs(self, prev_numbers: List[int]) -> np.ndarray:
        """Get transition probability vector from current sum bucket."""
        if self.transition_matrix is None:
            n_b = self.params.get('markov_sum_buckets', 5)
            return np.ones(n_b) / n_b
        s = sum(prev_numbers)
        sum_min = self.sum_min or 100
        sum_max = self.sum_max or 250
        n_buckets = self.transition_matrix.shape[0]
        bucket_size = max(1, (sum_max - sum_min) // n_buckets)
        bucket = min(int((s - sum_min) / bucket_size), n_buckets - 1)
        bucket = max(0, bucket)
        return self.transition_matrix[bucket]
    
    def train(self, game_type: str) -> None:
        """Train with K-Means clustering and local models."""
        df = get_historical_data(game_type)
        if df.empty or len(df) < 20:
            raise ValueError("Insufficient historical data for training")
        
        df = df.sort_values('draw_date').reset_index(drop=True)
        self.max_number = Config.GAMES[game_type]['max_number']
        
        sums = []
        for idx in range(len(df)):
            numbers = _get_row_numbers(df.iloc[idx])
            sums.append(sum(numbers))
        
        if self.params.get('use_historical_sum_range', True):
            self.sum_min = max(21, int(np.percentile(sums, 5)))
            self.sum_max = min(6 * self.max_number - 15, int(np.percentile(sums, 95)))
        else:
            self.sum_min = self.params.get('sum_min', 100)
            self.sum_max = self.params.get('sum_max', 250)
        if self.sum_min >= self.sum_max:
            self.sum_min = max(21, int(np.mean(sums)) - 50)
            self.sum_max = min(6 * self.max_number - 15, int(np.mean(sums)) + 50)
        
        frequency = calculate_frequency(game_type)
        _, self.transition_matrix = self._build_markov_transitions(df, self.max_number)
        
        n_clusters = self.params.get('n_clusters', 5)
        use_local = self.params.get('use_local_models', True) and len(df) >= 50
        
        cluster_data = []
        for idx in range(len(df)):
            numbers = _get_row_numbers(df.iloc[idx])
            s = sum(numbers)
            log_p = np.log(np.prod(numbers) + 1)
            deltas = _numbers_to_deltas(numbers)
            cluster_data.append([s, log_p] + list(deltas))
        
        X_cluster = np.array(cluster_data)
        
        if use_local and len(X_cluster) >= n_clusters * 3:
            n_components = min(3, X_cluster.shape[1], X_cluster.shape[0] - 1)
            self.pca = PCA(n_components=n_components, random_state=42)
            X_reduced = self.pca.fit_transform(X_cluster)
            self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            cluster_labels = self.kmeans.fit_predict(X_reduced)
            self.cluster_centers_ = self.kmeans.cluster_centers_
        else:
            cluster_labels = np.zeros(len(df), dtype=int)
            self.kmeans = None
            self.pca = None
        
        X_by_cluster = defaultdict(list)
        y_by_cluster = defaultdict(list)
        
        for idx in range(len(df) - 1):
            past_row = df.iloc[idx + 1]
            future_row = df.iloc[idx]
            past_numbers = _get_row_numbers(past_row)
            future_numbers = _get_row_numbers(future_row)
            
            markov_probs = self._get_markov_probs(past_numbers)
            X = self._build_features(past_numbers, frequency, markov_probs, self.max_number)
            y = np.zeros(self.max_number)
            for num in future_numbers:
                if 1 <= num <= self.max_number:
                    y[num - 1] = 1
            
            cluster_id = cluster_labels[idx + 1]
            X_by_cluster[cluster_id].append(X)
            y_by_cluster[cluster_id].append(y)
        
        self.models = {}
        rf_params = {k: v for k, v in self.params.items()
                     if k in ['n_estimators', 'max_depth', 'random_state']}
        
        for cluster_id in X_by_cluster:
            X_train = np.array(X_by_cluster[cluster_id])
            y_train = np.array(y_by_cluster[cluster_id])
            if len(X_train) >= 5:
                model = RandomForestClassifier(**rf_params)
                model.fit(X_train, y_train)
                self.models[cluster_id] = model
        
        if not self.models:
            X_all = np.vstack([np.array(X_by_cluster[c]) for c in X_by_cluster])
            y_all = np.vstack([np.array(y_by_cluster[c]) for c in y_by_cluster])
            self.models[0] = RandomForestClassifier(**rf_params)
            self.models[0].fit(X_all, y_all)
        
        first_cluster = next(iter(X_by_cluster))
        self.feature_size = len(X_by_cluster[first_cluster][0])
        self.is_trained = True
        self.trained_game_type = game_type
    
    def _get_model_for_draw(self, prev_numbers: List[int]) -> RandomForestClassifier:
        """Get the local model for the cluster containing this draw."""
        if self.kmeans is None or self.pca is None or 0 not in self.models:
            return self.models.get(0) or list(self.models.values())[0]
        
        s = sum(prev_numbers)
        log_p = np.log(np.prod(prev_numbers) + 1)
        deltas = _numbers_to_deltas(prev_numbers)
        point = np.array([[s, log_p] + list(deltas)])
        point_reduced = self.pca.transform(point)
        cluster_id = self.kmeans.predict(point_reduced)[0]
        return self.models.get(cluster_id) or self.models.get(0) or list(self.models.values())[0]
    
    def _get_appear_probs(self, model: RandomForestClassifier, X: np.ndarray) -> np.ndarray:
        """Extract P(appear) for each number from predict_proba."""
        probs = model.predict_proba(X)
        if isinstance(probs, list):
            return np.array([p[0, 1] for p in probs])
        if len(probs.shape) == 3:
            return probs[0, :, 1]
        return probs[0]
    
    def predict(self, game_type: str) -> List[int]:
        """Predict using Monte Carlo simulation with guard rails."""
        if not self.is_trained or self.trained_game_type != game_type:
            self.train(game_type)
        
        df = get_historical_data(game_type, limit=1)
        if df.empty:
            frequency = calculate_frequency(game_type)
            sorted_nums = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            return [int(n) for n, _ in sorted_nums[:6]]
        
        frequency = calculate_frequency(game_type)
        latest_row = df.iloc[0]
        prev_numbers = _get_row_numbers(latest_row)
        markov_probs = self._get_markov_probs(prev_numbers)
        X = self._build_features(prev_numbers, frequency, markov_probs, self.max_number).reshape(1, -1)
        
        model = self._get_model_for_draw(prev_numbers)
        appear_probs = self._get_appear_probs(model, X)
        
        if self.params.get('use_monte_carlo', True):
            return self._monte_carlo_predict(appear_probs, frequency)
        
        return self._top6_predict(appear_probs, frequency)
    
    def _monte_carlo_predict(self, appear_probs: np.ndarray, frequency: Dict) -> List[int]:
        """Monte Carlo (Ulam) prediction: generate candidates, filter by guard rails."""
        max_number = self.max_number
        sum_min = self.sum_min or 100
        sum_max = self.sum_max or 250
        n_candidates = self.params.get('mc_candidates', 100_000)
        batch_size = self.params.get('mc_batch_size', 10_000)
        
        probs = appear_probs + 0.01
        probs = probs / probs.sum()
        
        candidate_counts = defaultdict(int)
        n_batches = min(n_candidates // batch_size, 20)
        
        for _ in range(n_batches):
            for _ in range(batch_size):
                try:
                    indices = np.random.choice(max_number, size=6, replace=False, p=probs)
                    nums = sorted((int(i) + 1 for i in indices))
                except ValueError:
                    indices = np.argsort(probs)[::-1][:6]
                    nums = sorted((int(i) + 1 for i in indices))
                s = sum(nums)
                if sum_min <= s <= sum_max:
                    evens = sum(1 for n in nums if n % 2 == 0)
                    if evens != 0 and evens != 6:
                        key = tuple(nums)
                        candidate_counts[key] += 1
        
        if candidate_counts:
            best = max(candidate_counts.items(), key=lambda x: x[1])[0]
            return list(best)
        
        return self._top6_predict(appear_probs, frequency)
    
    def _top6_predict(self, appear_probs: np.ndarray, frequency: Dict) -> List[int]:
        """Fallback: pick top 6 by probability."""
        max_number = self.max_number
        top_indices = np.argsort(appear_probs)[::-1]
        predicted = []
        for idx in top_indices:
            num = int(idx) + 1
            if num <= max_number and num not in predicted:
                predicted.append(num)
                if len(predicted) == 6:
                    break
        if len(predicted) < 6:
            sorted_nums = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            for num, _ in sorted_nums:
                n = int(num)
                if n not in predicted and 1 <= n <= max_number:
                    predicted.append(n)
                    if len(predicted) == 6:
                        break
        return [int(n) for n in sorted(predicted[:6])]
