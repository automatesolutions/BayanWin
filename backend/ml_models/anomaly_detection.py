"""Normal Distribution model using sum/product representation and Gaussian distribution to predict most probable patterns."""
import numpy as np
from sklearn.mixture import GaussianMixture
from typing import List
# Removed SQLAlchemy - using InstantDB
from utils.data_processor import get_historical_data
from config import Config

class AnomalyDetectionModel:
    """Normal Distribution model for predicting lottery numbers based on highest probability patterns."""
    
    def __init__(self):
        self.gmm = None
        self.epsilon = None
        self.is_trained = False
        
    def train(self, game_type: str):
        """
        Train the Anomaly Detection model on historical data.
        
        Args:
            game_type: Game type identifier
        """
        # Get historical data
        df = get_historical_data(game_type)
        
        if df.empty or len(df) < 10:
            raise ValueError("Insufficient historical data for training")
        
        # Transform each draw: (sum(numbers), product(numbers))
        data_points = []
        
        for idx in range(len(df)):
            row = df.iloc[idx]
            numbers = [row['number_1'], row['number_2'], row['number_3'],
                      row['number_4'], row['number_5'], row['number_6']]
            
            sum_numbers = sum(numbers)
            product_numbers = np.prod(numbers)
            
            data_points.append([sum_numbers, product_numbers])
        
        if not data_points:
            raise ValueError("No valid data points")
        
        X = np.array(data_points)
        
        # Fit Gaussian distribution
        self.gmm = GaussianMixture(n_components=1, covariance_type='full')
        self.gmm.fit(X)
        
        # Calculate epsilon boundary (2-3 standard deviations)
        self.epsilon = Config.ANOMALY_DETECTION_PARAMS['epsilon']
        self.is_trained = True
    
    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction for next draw using Gaussian normal distribution.
        Picks numbers with HIGHEST probability (most normal/typical patterns).
        
        Args:
            game_type: Game type identifier
            
        Returns:
            List of 6 predicted numbers
        """
        if not self.is_trained:
            self.train(game_type)
        
        max_number = Config.GAMES[game_type]['max_number']
        numbers_count = Config.GAMES[game_type]['numbers_count']
        
        # Generate candidate number sets
        candidates = []
        
        # Generate random candidate sets and score them
        np.random.seed(None)
        
        for _ in range(1000):  # Generate many candidates
            candidate = sorted(np.random.choice(
                range(1, max_number + 1),
                size=numbers_count,
                replace=False
            ))
            
            sum_val = sum(candidate)
            product_val = np.prod(candidate)
            point = np.array([[sum_val, product_val]])
            
            # Calculate probability density (log likelihood)
            # Higher score = higher probability = more normal/typical
            score = self.gmm.score_samples(point)[0]
            
            # Store ALL candidates with their probability scores
            candidates.append((candidate, score))
        
        if candidates:
            # Sort by score (HIGHEST probability first - most normal patterns)
            candidates.sort(key=lambda x: x[1], reverse=True)
            return [int(num) for num in candidates[0][0]]  # Return the MOST normal combination
        
        # Fallback: generate based on distribution mean
        # Get mean sum and product from historical data
        df = get_historical_data(game_type)
        
        if not df.empty:
            sums = []
            products = []
            
            for idx in range(len(df)):
                row = df.iloc[idx]
                numbers = [row['number_1'], row['number_2'], row['number_3'],
                           row['number_4'], row['number_5'], row['number_6']]
                sums.append(sum(numbers))
                products.append(np.prod(numbers))
            
            mean_sum = np.mean(sums)
            mean_product = np.mean(products)
            
            # Try to find numbers that match mean sum/product
            # Use optimization or sampling
            best_candidate = None
            best_diff = float('inf')
            
            for _ in range(500):
                candidate = sorted(np.random.choice(
                    range(1, max_number + 1),
                    size=numbers_count,
                    replace=False
                ))
                
                sum_diff = abs(sum(candidate) - mean_sum)
                product_diff = abs(np.prod(candidate) - mean_product)
                total_diff = sum_diff + product_diff / 1000000  # Normalize product
                
                if total_diff < best_diff:
                    best_diff = total_diff
                    best_candidate = candidate
            
            if best_candidate:
                return [int(num) for num in best_candidate]
        
        # Final fallback: random selection
        return [int(num) for num in sorted(np.random.choice(
            range(1, max_number + 1),
            size=numbers_count,
            replace=False
        ))]

