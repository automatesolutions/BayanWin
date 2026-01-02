"""XGBoost prediction model for lottery numbers - Using InstantDB."""
import numpy as np
import xgboost as xgb
from typing import List, Tuple
from utils.data_processor import get_historical_data, extract_features, prepare_training_data
from utils.frequency_analysis import calculate_frequency
from config import Config

class XGBoostModel:
    """XGBoost model for predicting lottery numbers."""
    
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.trained_game_type = None  # Track which game type this model was trained on
        
    def train(self, game_type: str):
        """
        Train the XGBoost model on historical data.
        
        Args:
            game_type: Game type identifier
            db: Database session
        """
        # Get historical data
        df = get_historical_data(game_type)
        
        if df.empty or len(df) < 10:
            raise ValueError("Insufficient historical data for training")
        
        # Extract features
        features_df = extract_features(df)
        
        if features_df.empty:
            raise ValueError("Failed to extract features")
        
        # Prepare training data
        # For XGBoost, we'll predict probability of each number appearing
        max_number = Config.GAMES[game_type]['max_number']
        
        # Create training data: features -> number probabilities
        X_list = []
        y_list = []
        
        # Calculate frequency ONCE before the loop (not inside!)
        frequency = calculate_frequency(game_type)
        freq_features = [frequency.get(i, 0) for i in range(1, max_number + 1)]
        
        for idx in range(len(df)):
            row = df.iloc[idx]
            numbers = [row['number_1'], row['number_2'], row['number_3'],
                       row['number_4'], row['number_5'], row['number_6']]
            
            if idx < len(features_df):
                feature_row = features_df.iloc[idx]
                # Use previous draws as features
                if idx > 0:
                    prev_row = df.iloc[idx - 1]
                    prev_numbers = sorted([prev_row['number_1'], prev_row['number_2'],
                                          prev_row['number_3'], prev_row['number_4'],
                                          prev_row['number_5'], prev_row['number_6']])
                    
                    # Feature vector: frequency stats + previous numbers
                    # (frequency calculated once above, not in loop)
                    
                    # Combine features
                    X = np.concatenate([
                        freq_features,
                        prev_numbers + [0] * (6 - len(prev_numbers))  # Pad if needed
                    ])
                    
                    # Target: binary vector indicating which numbers appeared
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
        
        # Train XGBoost model
        params = Config.XGBOOST_PARAMS.copy()
        params['objective'] = 'binary:logistic'
        params['eval_metric'] = 'logloss'
        
        self.model = xgb.XGBClassifier(**params)
        self.model.fit(X_train, y_train)
        self.is_trained = True
        self.trained_game_type = game_type  # Remember which game type we trained on
    
    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction for next draw.
        
        Args:
            game_type: Game type identifier
            
        Returns:
            List of 6 predicted numbers
        """
        # Retrain if not trained or if game type changed (different max_number = different feature size)
        if not self.is_trained or self.trained_game_type != game_type:
            self.train(game_type)
        
        max_number = Config.GAMES[game_type]['max_number']
        
        # Get latest draw for features
        df = get_historical_data(game_type, limit=1)
        
        if df.empty:
            # No historical data, use frequency-based prediction
            frequency = calculate_frequency(game_type)
            sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            return [int(num) for num, _ in sorted_numbers[:6]]
        
        # Get frequency features
        frequency = calculate_frequency(game_type)
        freq_features = [frequency.get(i, 0) for i in range(1, max_number + 1)]
        
        # Get previous numbers
        latest_row = df.iloc[0]
        prev_numbers = sorted([latest_row['number_1'], latest_row['number_2'],
                              latest_row['number_3'], latest_row['number_4'],
                              latest_row['number_5'], latest_row['number_6']])
        
        # Prepare feature vector
        X = np.concatenate([
            freq_features,
            prev_numbers + [0] * (6 - len(prev_numbers))
        ]).reshape(1, -1)
        
        # Predict probabilities
        probabilities = self.model.predict_proba(X)[0]
        
        # Select top 6 numbers based on probabilities
        top_indices = np.argsort(probabilities)[::-1][:6]
        predicted_numbers = [idx + 1 for idx in top_indices if idx < max_number]
        
        # Ensure we have exactly 6 unique numbers
        predicted_numbers = list(set(predicted_numbers))[:6]
        
        # If we don't have 6, fill with high-frequency numbers
        if len(predicted_numbers) < 6:
            frequency = calculate_frequency(game_type)
            sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            for num, _ in sorted_numbers:
                if num not in predicted_numbers and num <= max_number:
                    predicted_numbers.append(num)
                    if len(predicted_numbers) == 6:
                        break
        
        return [int(num) for num in sorted(predicted_numbers[:6])]

