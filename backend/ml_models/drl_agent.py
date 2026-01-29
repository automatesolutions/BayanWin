"""Deep Reinforcement Learning agent with 3 feedback loops."""
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from typing import List, Tuple, Dict
# Removed SQLAlchemy - using InstantDB
from utils.data_processor import get_historical_data
from utils.frequency_analysis import get_hot_numbers, get_cold_numbers, get_overdue_numbers
from utils.error_distance_calculator import calculate_all_metrics
from config import Config
import logging

logger = logging.getLogger(__name__)

class DRLAgent:
    """Deep Reinforcement Learning agent for lottery prediction."""
    
    def __init__(self):
        self.model = None
        self.target_model = None
        self.memory = []
        self.epsilon = Config.DRL_PARAMS['epsilon']
        self.epsilon_decay = Config.DRL_PARAMS['epsilon_decay']
        self.epsilon_min = Config.DRL_PARAMS['epsilon_min']
        self.gamma = Config.DRL_PARAMS['gamma']
        self.is_trained = False
        self.trained_game_type = None  # Track which game type this model was trained on
        
    def _build_model(self, state_size: int, action_size: int):
        """Build DQN model (optimized for speed)."""
        # Reduced model size for faster training
        model = keras.Sequential([
            layers.Dense(64, activation='relu', input_shape=(state_size,)),  # Reduced from 128
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),  # Reduced from 128
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),  # Reduced from 64
            layers.Dense(action_size, activation='linear')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=Config.DRL_PARAMS['learning_rate']),
            loss='mse'
        )
        
        return model
    
    def _get_state(self, game_type: str, recent_error_distance: float = None, error_history: List[float] = None) -> np.ndarray:
        """
        Get current state representation with ENHANCED error distance awareness.
        
        State includes:
        - Historical draws (encoded)
        - Frequency stats
        - Hot/cold/overdue numbers
        - Error distance history with trend analysis (ENHANCED)
        """
        df = get_historical_data(game_type, limit=10)
        max_number = Config.GAMES[game_type]['max_number']
        
        state = []
        
        # Frequency features
        hot_numbers = get_hot_numbers(game_type, top_n=10)
        cold_numbers = get_cold_numbers(game_type, bottom_n=10)
        overdue_numbers = get_overdue_numbers(game_type)[:10]
        
        # One-hot encoding for hot numbers
        hot_vector = np.zeros(max_number)
        for num, _ in hot_numbers:
            if 1 <= num <= max_number:
                hot_vector[num - 1] = 1
        
        # One-hot encoding for cold numbers
        cold_vector = np.zeros(max_number)
        for num, _ in cold_numbers:
            if 1 <= num <= max_number:
                cold_vector[num - 1] = 1
        
        # One-hot encoding for overdue numbers
        overdue_vector = np.zeros(max_number)
        for num, _ in overdue_numbers:
            if 1 <= num <= max_number:
                overdue_vector[num - 1] = 1
        
        # Recent draws encoding
        if not df.empty:
            latest_row = df.iloc[0]
            recent_numbers = sorted([
                latest_row['number_1'], latest_row['number_2'], latest_row['number_3'],
                latest_row['number_4'], latest_row['number_5'], latest_row['number_6']
            ])
            recent_vector = np.zeros(max_number)
            for num in recent_numbers:
                if 1 <= num <= max_number:
                    recent_vector[num - 1] = 1
        else:
            recent_vector = np.zeros(max_number)
        
        # ENHANCED: Add error distance features with trend analysis
        max_error = 200  # Approximate max
        if recent_error_distance is not None:
            normalized_error = min(recent_error_distance / max_error, 1.0)
            
            # Calculate error trend if history is available
            if error_history and len(error_history) >= 3:
                recent_errors = error_history[-5:]  # Last 5 errors
                avg_recent_error = np.mean(recent_errors)
                error_variance = np.var(recent_errors) if len(recent_errors) > 1 else 0.0
                
                # Trend: positive = improving (errors decreasing), negative = worsening
                if len(recent_errors) >= 2:
                    trend = (recent_errors[-2] - recent_errors[-1]) / max_error  # Normalized trend
                else:
                    trend = 0.0
                
                # Normalize variance
                normalized_variance = min(error_variance / (max_error ** 2), 1.0)
                normalized_avg = min(avg_recent_error / max_error, 1.0)
                
                error_features = np.array([
                    normalized_error,           # Current error
                    1.0 - normalized_error,     # Inverse current error
                    normalized_avg,             # Recent average error
                    normalized_variance,        # Error variance (consistency)
                    trend                       # Error trend (improving/worsening)
                ])
            else:
                # Fallback: just current error if no history
                error_features = np.array([
                    normalized_error,
                    1.0 - normalized_error,
                    0.5,  # Unknown average
                    0.5,  # Unknown variance
                    0.0   # Unknown trend
                ])
        else:
            error_features = np.array([0.5, 0.5, 0.5, 0.5, 0.0])  # Neutral if unknown
        
        # Combine state features
        state = np.concatenate([
            hot_vector,
            cold_vector,
            overdue_vector,
            recent_vector,
            error_features  # ENHANCED: Error distance with trend awareness
        ])
        
        return state
    
    def _action_to_numbers(self, action: int, game_type: str) -> List[int]:
        """Convert action index to number selection."""
        max_number = Config.GAMES[game_type]['max_number']
        numbers_count = Config.GAMES[game_type]['numbers_count']
        
        # Simple mapping: use action as seed for number selection
        np.random.seed(action)
        numbers = sorted(np.random.choice(
            range(1, max_number + 1),
            size=numbers_count,
            replace=False
        ))
        
        return [int(num) for num in numbers]
    
    def _calculate_reward(self, predicted: List[int], actual: List[int], 
                         game_type: str, error_distance: float = None) -> float:
        """
        Calculate reward using 3 feedback loops with IMPROVED error distance focus.
        
        Feedback Loop A: Error Distance Analysis (PRIMARY - gradient descent style)
        Feedback Loop B: K-Means & PCA
        Feedback Loop C: Frequency Analysis
        """
        reward_a = 0.0
        reward_b = 0.0
        reward_c = 0.0
        
        # Feedback Loop A: Error Distance Analysis (IMPROVED)
        if actual:
            if error_distance is not None:
                # Use provided error_distance (from accuracy records)
                euclidean_dist = error_distance
                # Calculate matches from predicted/actual if needed
                predicted_set = set(predicted)
                actual_set = set(actual)
                matches = len(predicted_set.intersection(actual_set))
            else:
                # Calculate from scratch
                metrics = calculate_all_metrics(predicted, actual)
                euclidean_dist = metrics.get('euclidean_distance', 100)
                matches = metrics.get('set_intersection', 0)
            
            # IMPROVED REWARD: Inverse relationship with error distance (like gradient descent)
            # Lower error = Higher reward
            # Formula: reward = base_reward / (1 + normalized_error)
            # This creates a smooth gradient for learning
            max_possible_error = 200  # Approximate max for 6/58 lottery
            normalized_error = euclidean_dist / max_possible_error
            
            # ENHANCED: Stronger error reward with better gradient
            # Scale: 0-200 reward range (doubled for stronger signal)
            # Reduced multiplier from 10 to 5 for steeper gradient
            error_reward = 200.0 / (1.0 + normalized_error * 5)
            
            # Bonus for matches (secondary signal)
            match_bonus = matches * 15  # Increased from 10 to 15
            
            # Combined: Error distance is PRIMARY, matches are BONUS
            reward_a = error_reward + match_bonus
        
        # Feedback Loop B: K-Means & PCA (simplified for performance)
        # Skip expensive clustering if we have limited data or time constraints
        df = get_historical_data(game_type, limit=200)  # Reduced from 1000 to 200
        if len(df) >= 30:  # Reduced threshold from 50 to 30
            try:
                # Prepare data for clustering (simplified)
                data_points = []
                for idx in range(min(len(df), 100)):  # Limit to first 100 rows
                    row = df.iloc[idx]
                    numbers = sorted([
                        row['number_1'], row['number_2'], row['number_3'],
                        row['number_4'], row['number_5'], row['number_6']
                    ])
                    sum_val = sum(numbers)
                    product_val = np.prod(numbers) if np.prod(numbers) < 1e10 else 1e10  # Prevent overflow
                    data_points.append([sum_val, product_val])
                
                if len(data_points) >= 5:
                    X = np.array(data_points)
                    
                    # Apply PCA (faster with fewer components)
                    pca = PCA(n_components=min(2, len(data_points) - 1))
                    X_pca = pca.fit_transform(X)
                    
                    # K-Means clustering (fewer clusters for speed)
                    n_clusters = min(3, len(data_points) // 10)  # Reduced from 5 to 3
                    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=3)  # Reduced n_init
                    clusters = kmeans.fit_predict(X_pca)
                    
                    # Check if prediction falls in high-density cluster
                    pred_sum = sum(predicted)
                    pred_product = min(np.prod(predicted), 1e10)  # Prevent overflow
                    pred_point = pca.transform([[pred_sum, pred_product]])[0]
                    pred_cluster = kmeans.predict([pred_point])[0]
                    
                    # Reward based on cluster density
                    cluster_density = np.sum(clusters == pred_cluster) / len(clusters)
                    reward_b = cluster_density * 20
            except Exception as e:
                # If clustering fails, just skip this reward component
                reward_b = 0
        
        # Feedback Loop C: Frequency Analysis
        hot_numbers = get_hot_numbers(game_type, top_n=10)
        hot_set = set([num for num, _ in hot_numbers])
        
        cold_numbers = get_cold_numbers(game_type, bottom_n=10)
        cold_set = set([num for num, _ in cold_numbers])
        
        overdue_numbers = get_overdue_numbers(game_type)[:10]
        overdue_set = set([num for num, _ in overdue_numbers])
        
        # Reward alignment with frequency-weighted sets
        predicted_set = set(predicted)
        hot_matches = len(predicted_set.intersection(hot_set))
        cold_matches = len(predicted_set.intersection(cold_set))
        overdue_matches = len(predicted_set.intersection(overdue_set))
        
        # Prefer hot and overdue numbers, avoid too many cold numbers
        reward_c = hot_matches * 5 + overdue_matches * 3 - cold_matches * 2
        
        # ENHANCED: Weighted combination - Error distance is 85% of reward
        # This makes error distance the dominant learning signal
        total_reward = reward_a * 0.85 + reward_b * 0.10 + reward_c * 0.05
        
        return total_reward
    
    def train(self, game_type: str, episodes: int = 100):
        """
        Train the DRL agent.
        
        Args:
            game_type: Game type identifier
            db: Database session
            episodes: Number of training episodes
        """
        df = get_historical_data(game_type)
        if df.empty or len(df) < 20:
            raise ValueError("Insufficient historical data for DRL training")
        
        max_number = Config.GAMES[game_type]['max_number']
        state_size = max_number * 4 + 5  # hot, cold, overdue, recent vectors + error features (ENHANCED: 5 features)
        action_size = 1000  # Action space size
        
        # Build models
        self.model = self._build_model(state_size, action_size)
        self.target_model = self._build_model(state_size, action_size)
        self.target_model.set_weights(self.model.get_weights())
        
        # Training loop
        for episode in range(episodes):
            # Print progress every episode for small episode counts
            if episodes <= 5:
                print(f"      DRL training: {episode + 1}/{episodes} episodes...")
            elif episode % 2 == 0 and episode > 0:
                print(f"      DRL training: {episode}/{episodes} episodes...")
            
            state = self._get_state(game_type)
            # Ensure state is 1D and has correct shape
            state_1d = np.array(state).flatten()
            state_reshaped = state_1d.reshape(1, -1)  # For prediction
            
            # Epsilon-greedy action selection
            if np.random.random() <= self.epsilon:
                action = np.random.randint(0, action_size)
            else:
                q_values = self.model.predict(state_reshaped, verbose=0)
                action = np.argmax(q_values[0])
            
            # Get predicted numbers
            predicted = self._action_to_numbers(action, game_type)
            
            # Get actual result (use most recent if available)
            actual = None
            if not df.empty:
                latest_row = df.iloc[0]
                actual = [
                    latest_row['number_1'], latest_row['number_2'], latest_row['number_3'],
                    latest_row['number_4'], latest_row['number_5'], latest_row['number_6']
                ]
            
            # Calculate reward
            reward = self._calculate_reward(predicted, actual, game_type)
            
            # Store in memory - ensure state is 1D array with consistent shape
            # Store as numpy array with explicit dtype to ensure consistency
            self.memory.append((state_1d.astype(np.float32), action, reward))
            
            # Update epsilon
            if self.epsilon > self.epsilon_min:
                self.epsilon *= self.epsilon_decay
            
            # Train on batch if memory is sufficient (reduced batch size for speed)
            if len(self.memory) >= 16:  # Reduced from 32 to 16
                batch_size = min(16, len(self.memory))  # Reduced from 32 to 16
                batch_indices = np.random.choice(len(self.memory), size=batch_size, replace=False)
                # Get states from memory - they should all have the same shape
                # Use stack instead of array to ensure proper shape handling
                try:
                    states_batch = np.stack([self.memory[i][0] for i in batch_indices])
                except ValueError as e:
                    # If shapes don't match, log and skip this batch
                    print(f"      Warning: State shape mismatch in batch, skipping training: {e}")
                    continue
                actions_batch = np.array([self.memory[i][1] for i in batch_indices])
                rewards_batch = np.array([self.memory[i][2] for i in batch_indices])
                
                # Update Q-values
                q_values = self.model.predict(states_batch, verbose=0)
                q_values[range(len(batch_indices)), actions_batch] = rewards_batch
                
                # Faster training with fewer epochs
                self.model.fit(states_batch, q_values, epochs=1, verbose=0, batch_size=batch_size)
            
            # Update target model periodically
            if episode % 10 == 0:
                self.target_model.set_weights(self.model.get_weights())
        
        self.is_trained = True
        self.trained_game_type = game_type  # Remember which game type we trained on
    
    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction using trained DRL agent.
        
        Args:
            game_type: Game type identifier
            db: Database session
            
        Returns:
            List of 6 predicted numbers
        """
        # Retrain if not trained or if game type changed (different max_number = different state size)
        if not self.is_trained or self.trained_game_type != game_type:
            self.train(game_type, episodes=3)  # Reduced to 3 episodes for faster predictions
        
        state = self._get_state(game_type)
        state = state.reshape(1, -1)
        
        # Get best action
        q_values = self.model.predict(state, verbose=0)
        action = np.argmax(q_values[0])
        
        # Convert to numbers
        predicted = self._action_to_numbers(action, game_type)
        
        return predicted
    
    def learn_from_accuracy_records(self, game_type: str, accuracy_records: List[Dict], instantdb_client=None):
        """
        Learn from stored prediction accuracy records.
        This creates a continuous learning loop using past predictions.
        
        Args:
            game_type: Game type identifier
            accuracy_records: List of accuracy records from prediction_accuracy table
            instantdb_client: InstantDB client instance (optional, will import if not provided)
        """
        if not accuracy_records or len(accuracy_records) < 5:
            return  # Need minimum data to learn
        
        # Import instantdb if not provided
        if instantdb_client is None:
            from services.instantdb_client import instantdb
            instantdb_client = instantdb
        
        try:
            # Get predictions and results for these accuracy records
            predictions = instantdb_client.get_predictions(game_type, limit=1000)
            results = instantdb_client.get_results(game_type, limit=1000)
            
            # Filter for DRL predictions only
            drl_predictions = {p.get('id'): p for p in predictions if p.get('model_type') == 'DRL'}
            
            # Build training data from accuracy records (only for DRL predictions)
            # ENHANCED: Use all records with weighted sampling based on error
            learning_data = []
            prioritized_records = []
            
            # Collect error history for trend analysis
            error_history = []
            for acc_record in accuracy_records[-100:]:  # Use last 100 records
                error_dist = acc_record.get('error_distance')
                if error_dist is not None:
                    error_history.append(float(error_dist))
            
            for acc_record in accuracy_records[-100:]:  # Use last 100 records
                prediction_id = acc_record.get('prediction_id')
                
                # Only learn from DRL predictions
                if prediction_id not in drl_predictions:
                    continue
                
                prediction = drl_predictions[prediction_id]
                result_id = acc_record.get('result_id')
                
                # Find matching result
                result = next((r for r in results if r.get('id') == result_id), None)
                
                if not result:
                    continue
                
                # Get error_distance directly from accuracy record
                error_distance = acc_record.get('error_distance')
                if error_distance is None:
                    continue  # Skip if no error distance
                
                predicted = [
                    prediction.get('predicted_number_1'),
                    prediction.get('predicted_number_2'),
                    prediction.get('predicted_number_3'),
                    prediction.get('predicted_number_4'),
                    prediction.get('predicted_number_5'),
                    prediction.get('predicted_number_6')
                ]
                
                actual = [
                    result.get('number_1'), result.get('number_2'),
                    result.get('number_3'), result.get('number_4'),
                    result.get('number_5'), result.get('number_6')
                ]
                
                # ENHANCED: Get state with error distance and trend awareness
                state = self._get_state(game_type, recent_error_distance=error_distance, error_history=error_history)
                state_1d = np.array(state).flatten()
                
                # Use error_distance directly in reward calculation
                reward = self._calculate_reward(predicted, actual, game_type, error_distance=error_distance)
                
                # ENHANCED: Weight by inverse error (lower error = higher weight)
                # This allows learning from all examples, not just top 50
                weight = 1.0 / (1.0 + error_distance)
                prioritized_records.append((state_1d.astype(np.float32), reward, weight, error_distance))
            
            # ENHANCED: Use weighted sampling instead of just top 50
            # Sort by error (ascending) for better organization
            prioritized_records.sort(key=lambda x: x[3])  # Sort by error_distance
            
            # Use all records but weight them by error (inverse relationship)
            # Lower error records get higher weight in training
            if len(prioritized_records) > 0:
                weights = np.array([rec[2] for rec in prioritized_records])
                weights = weights / weights.sum()  # Normalize weights
                
                # Sample records based on weights (prefer low-error but include all)
                # Use at least 50 records, or all if less than 50
                n_samples = min(max(50, len(prioritized_records)), len(prioritized_records))
                if len(prioritized_records) <= 50:
                    # Use all records
                    selected_records = prioritized_records
                else:
                    # Weighted sampling: prefer low-error records but include variety
                    # Take top 30 low-error + sample 20 more based on weights
                    top_low_error = prioritized_records[:30]
                    remaining = prioritized_records[30:]
                    if len(remaining) > 0:
                        remaining_weights = weights[30:] / weights[30:].sum()
                        sampled_indices = np.random.choice(
                            len(remaining),
                            size=min(20, len(remaining)),
                            replace=False,
                            p=remaining_weights
                        )
                        sampled_remaining = [remaining[i] for i in sampled_indices]
                        selected_records = top_low_error + sampled_remaining
                    else:
                        selected_records = top_low_error
            else:
                selected_records = []
            
            # Convert to learning data format
            learning_data = [(state, reward) for state, reward, _, _ in selected_records]
            
            if len(learning_data) < 5:
                return  # Not enough data
            
            # Ensure model is built
            if self.model is None:
                max_number = Config.GAMES[game_type]['max_number']
                state_size = max_number * 4 + 5  # ENHANCED: Updated to include error trend features (5 features)
                action_size = 1000
                self.model = self._build_model(state_size, action_size)
                self.target_model = self._build_model(state_size, action_size)
                self.target_model.set_weights(self.model.get_weights())
            
            # ENHANCED: Train with error-distance-focused learning
            states_batch = np.stack([data[0] for data in learning_data])
            rewards_batch = np.array([data[1] for data in learning_data])
            
            # Calculate average error distance for logging and adaptive learning
            avg_error = np.mean([rec[3] for rec in selected_records]) if selected_records else 0
            
            # Get current Q-values
            q_values = self.model.predict(states_batch, verbose=0)
            
            # ENHANCED: Use reward as target for best action with gradient-style update
            # Higher reward (lower error) should increase Q-value more
            best_actions = np.argmax(q_values, axis=1)
            
            # ENHANCED: Adaptive learning rate based on error level
            # Higher errors = more aggressive learning (higher alpha)
            # Lower errors = more conservative learning (lower alpha)
            base_alpha = 0.3
            max_alpha = 0.7
            if avg_error > 0:
                # Scale alpha from 0.3 to 0.7 based on error level
                # High errors (100+) get alpha ~0.7, low errors (20-) get alpha ~0.3
                error_factor = min(avg_error / 200.0, 1.0)  # Normalize to 0-1
                alpha = base_alpha + (max_alpha - base_alpha) * error_factor
            else:
                alpha = base_alpha
            
            current_q_values = q_values[range(len(learning_data)), best_actions]
            target_q_values = alpha * rewards_batch + (1 - alpha) * current_q_values
            q_values[range(len(learning_data)), best_actions] = target_q_values
            
            # IMPROVED: Multiple epochs for better convergence (but still fast)
            epochs = min(3, max(1, len(learning_data) // 10))  # Adaptive epochs
            self.model.fit(
                states_batch, q_values, 
                epochs=epochs, 
                verbose=0, 
                batch_size=min(16, len(learning_data)),
                validation_split=0.1 if len(learning_data) > 10 else 0
            )
            
            # Update target model periodically for stability
            if len(learning_data) >= 10:
                self.target_model.set_weights(self.model.get_weights())
            
            logger.info(
                f"DRL agent updated with {len(learning_data)} accuracy records for {game_type}. "
                f"Avg error distance: {avg_error:.2f}, Learning rate (alpha): {alpha:.3f}"
            )
            
        except Exception as e:
            logger.warning(f"Failed to learn from accuracy records: {e}")
            import traceback
            logger.debug(traceback.format_exc())

