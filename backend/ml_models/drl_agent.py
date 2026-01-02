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
        """Build DQN model."""
        model = keras.Sequential([
            layers.Dense(128, activation='relu', input_shape=(state_size,)),
            layers.Dropout(0.2),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(action_size, activation='linear')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=Config.DRL_PARAMS['learning_rate']),
            loss='mse'
        )
        
        return model
    
    def _get_state(self, game_type: str) -> np.ndarray:
        """
        Get current state representation.
        
        State includes:
        - Historical draws (encoded)
        - Frequency stats
        - Hot/cold/overdue numbers
        - Previous 5 predictions
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
        
        # Combine state features
        state = np.concatenate([
            hot_vector,
            cold_vector,
            overdue_vector,
            recent_vector
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
                         game_type: str) -> float:
        """
        Calculate reward using 3 feedback loops.
        
        Feedback Loop A: Error Distance Analysis
        Feedback Loop B: K-Means & PCA
        Feedback Loop C: Frequency Analysis
        """
        reward_a = 0.0
        reward_b = 0.0
        reward_c = 0.0
        
        # Feedback Loop A: Error Distance Analysis
        if actual:
            metrics = calculate_all_metrics(predicted, actual)
            # Reward inversely proportional to distance
            euclidean_dist = metrics.get('euclidean_distance', 100)
            matches = metrics.get('set_intersection', 0)
            reward_a = matches * 10 - euclidean_dist * 0.1
        
        # Feedback Loop B: K-Means & PCA
        df = get_historical_data(game_type, limit=1000)
        if len(df) >= 50:
            # Prepare data for clustering
            data_points = []
            for idx in range(len(df)):
                row = df.iloc[idx]
                numbers = sorted([
                    row['number_1'], row['number_2'], row['number_3'],
                    row['number_4'], row['number_5'], row['number_6']
                ])
                sum_val = sum(numbers)
                product_val = np.prod(numbers)
                data_points.append([sum_val, product_val])
            
            if len(data_points) >= 5:
                X = np.array(data_points)
                
                # Apply PCA
                pca = PCA(n_components=2)
                X_pca = pca.fit_transform(X)
                
                # K-Means clustering
                kmeans = KMeans(n_clusters=min(5, len(data_points) // 10), random_state=42)
                clusters = kmeans.fit_predict(X_pca)
                
                # Check if prediction falls in high-density cluster
                pred_sum = sum(predicted)
                pred_product = np.prod(predicted)
                pred_point = pca.transform([[pred_sum, pred_product]])[0]
                pred_cluster = kmeans.predict([pred_point])[0]
                
                # Reward based on cluster density
                cluster_density = np.sum(clusters == pred_cluster) / len(clusters)
                reward_b = cluster_density * 20
        
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
        
        # Combined reward
        total_reward = reward_a + reward_b + reward_c
        
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
        state_size = max_number * 4  # hot, cold, overdue, recent vectors
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
            state_reshaped = state.reshape(1, -1)  # For prediction
            
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
            
            # Store in memory - flatten state to 1D for consistent batch creation
            state_flattened = state.flatten()
            self.memory.append((state_flattened, action, reward))
            
            # Update epsilon
            if self.epsilon > self.epsilon_min:
                self.epsilon *= self.epsilon_decay
            
            # Train on batch if memory is sufficient
            if len(self.memory) >= 32:
                batch = np.random.choice(len(self.memory), size=min(32, len(self.memory)), replace=False)
                # States are already flattened when stored, but ensure consistent shape
                states_batch = np.array([self.memory[i][0] for i in batch])
                actions_batch = np.array([self.memory[i][1] for i in batch])
                rewards_batch = np.array([self.memory[i][2] for i in batch])
                
                # Update Q-values
                q_values = self.model.predict(states_batch, verbose=0)
                q_values[range(len(batch)), actions_batch] = rewards_batch
                
                self.model.fit(states_batch, q_values, epochs=1, verbose=0)
            
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
            self.train(game_type, episodes=5)  # Reduced to 5 episodes for faster predictions
        
        state = self._get_state(game_type)
        state = state.reshape(1, -1)
        
        # Get best action
        q_values = self.model.predict(state, verbose=0)
        action = np.argmax(q_values[0])
        
        # Convert to numbers
        predicted = self._action_to_numbers(action, game_type)
        
        return predicted

