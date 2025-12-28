"""Anomaly Detection model using sum/product representation and Gaussian distribution."""
import numpy as np
from sklearn.mixture import GaussianMixture
from typing import List
# Removed SQLAlchemy - using InstantDB
from utils.data_processor import get_historical_data
from config import Config

class AnomalyDetectionModel:
    """Anomaly Detection model for predicting lottery numbers."""
    
    def __init__(self):
        self.gmm = None
        self.epsilon = None
        self.is_trained = False
        
    def train(self, game_type: str):
        """
        Train the Anomaly Detection model on historical data.
        
        Args:
            game_type: Game type identifier
            db: Database session
        """
        # Get historical data
        df = get_historical_data(game_type, db)
        
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
        Generate prediction for next draw using anomaly detection.
        
        Args:
            game_type: Game type identifier
            db: Database session
            
        Returns:
            List of 6 predicted numbers
        """
        if not self.is_trained:
            self.train(game_type)
        
        max_number = Config.GAMES[game_type]['max_number']
        numbers_count = Config.GAMES[game_type]['numbers_count']
        
        # Generate candidate number sets
        candidates = []
        
        # Sample from distribution and find anomalies
        # Generate random candidate sets
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
            
            # Calculate probability density
            score = self.gmm.score_samples(point)[0]
            mean_score = self.gmm.score_samples(self.gmm.means_)[0]
            
            # Check if outside epsilon boundary (anomaly)
            if score < mean_score - self.epsilon:
                candidates.append((candidate, abs(score - mean_score)))
        
        if candidates:
            # Sort by anomaly score (most anomalous first)
            candidates.sort(key=lambda x: x[1], reverse=True)
            return candidates[0][0]
        
        # Fallback: generate based on distribution mean
        # Get mean sum and product from historical data
        df = get_historical_data(game_type, db)
        
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
                return best_candidate
        
        # Final fallback: random selection
        return sorted(np.random.choice(
            range(1, max_number + 1),
            size=numbers_count,
            replace=False
        ))

