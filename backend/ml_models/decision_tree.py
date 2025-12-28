"""Decision Tree/Random Forest prediction model for lottery numbers."""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import List
# Removed SQLAlchemy - using InstantDB
from utils.data_processor import get_historical_data
from utils.frequency_analysis import calculate_frequency
from config import Config

class DecisionTreeModel:
    """Random Forest model for predicting lottery numbers."""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        
    def train(self, game_type: str):
        """
        Train the Random Forest model on historical data.
        
        Args:
            game_type: Game type identifier
            db: Database session
        """
        # Get historical data
        df = get_historical_data(game_type)
        
        if df.empty or len(df) < 10:
            raise ValueError("Insufficient historical data for training")
        
        max_number = Config.GAMES[game_type]['max_number']
        
        # Prepare training data
        X_list = []
        y_list = []
        
        frequency = calculate_frequency(game_type, db)
        
        for idx in range(len(df)):
            if idx == 0:
                continue
            
            row = df.iloc[idx]
            prev_row = df.iloc[idx - 1]
            
            numbers = [row['number_1'], row['number_2'], row['number_3'],
                       row['number_4'], row['number_5'], row['number_6']]
            prev_numbers = sorted([prev_row['number_1'], prev_row['number_2'],
                                  prev_row['number_3'], prev_row['number_4'],
                                  prev_row['number_5'], prev_row['number_6']])
            
            # Features: frequency stats + previous numbers + statistical features
            freq_features = [frequency.get(i, 0) for i in range(1, max_number + 1)]
            prev_features = prev_numbers + [0] * (6 - len(prev_numbers))
            
            # Statistical features
            stat_features = [
                sum(prev_numbers),
                np.mean(prev_numbers),
                np.std(prev_numbers),
                max(prev_numbers),
                min(prev_numbers)
            ]
            
            X = np.concatenate([freq_features, prev_features, stat_features])
            
            # Target: which numbers appeared (binary classification per number)
            y = np.zeros(max_number)
            for num in numbers:
                if 1 <= num <= max_number:
                    y[num - 1] = 1
            
            X_list.append(X)
            y_list.append(y)
        
        if not X_list:
            raise ValueError("No valid training samples")
        
        X_train = np.array(X_list)
        y_train = np.array(y_list)
        
        # Train Random Forest
        params = Config.DECISION_TREE_PARAMS.copy()
        self.model = RandomForestClassifier(**params)
        self.model.fit(X_train, y_train)
        self.is_trained = True
    
    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction for next draw.
        
        Args:
            game_type: Game type identifier
            db: Database session
            
        Returns:
            List of 6 predicted numbers
        """
        if not self.is_trained:
            self.train(game_type)
        
        max_number = Config.GAMES[game_type]['max_number']
        
        # Get latest draw for features
        df = get_historical_data(game_type, db, limit=1)
        
        if df.empty:
            # No historical data, use frequency-based prediction
            frequency = calculate_frequency(game_type, db)
            sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            return [num for num, _ in sorted_numbers[:6]]
        
        # Prepare feature vector
        frequency = calculate_frequency(game_type, db)
        freq_features = [frequency.get(i, 0) for i in range(1, max_number + 1)]
        
        latest_row = df.iloc[0]
        prev_numbers = sorted([latest_row['number_1'], latest_row['number_2'],
                              latest_row['number_3'], latest_row['number_4'],
                              latest_row['number_5'], latest_row['number_6']])
        
        prev_features = prev_numbers + [0] * (6 - len(prev_numbers))
        stat_features = [
            sum(prev_numbers),
            np.mean(prev_numbers),
            np.std(prev_numbers),
            max(prev_numbers),
            min(prev_numbers)
        ]
        
        X = np.concatenate([freq_features, prev_features, stat_features]).reshape(1, -1)
        
        # Predict probabilities
        probabilities = self.model.predict_proba(X)[0]
        
        # Select top 6 numbers
        top_indices = np.argsort(probabilities)[::-1][:6]
        predicted_numbers = [idx + 1 for idx in top_indices if idx < max_number]
        predicted_numbers = list(set(predicted_numbers))[:6]
        
        # Fill if needed
        if len(predicted_numbers) < 6:
            sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            for num, _ in sorted_numbers:
                if num not in predicted_numbers and num <= max_number:
                    predicted_numbers.append(num)
                    if len(predicted_numbers) == 6:
                        break
        
        return sorted(predicted_numbers[:6])

