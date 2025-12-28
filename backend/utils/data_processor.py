"""Data processing utilities for ML models - Using InstantDB."""
import pandas as pd
import numpy as np
from typing import List, Tuple
from services.instantdb_client import instantdb

def get_historical_data(game_type: str, limit: int = None) -> pd.DataFrame:
    """
    Get historical lottery data as DataFrame.
    
    Args:
        game_type: Game type identifier
        limit: Optional limit on number of records
        
    Returns:
        DataFrame with columns: draw_date, draw_number, number_1-6, jackpot, winners
    """
    # Get results from InstantDB
    results = instantdb.get_results(game_type, limit=limit or 10000, offset=0, order_by='draw_date.desc')
    
    if not results:
        return pd.DataFrame()
    
    data = []
    for result in results:
        data.append({
            'draw_date': result.get('draw_date'),
            'draw_number': result.get('draw_number'),
            'number_1': result.get('number_1'),
            'number_2': result.get('number_2'),
            'number_3': result.get('number_3'),
            'number_4': result.get('number_4'),
            'number_5': result.get('number_5'),
            'number_6': result.get('number_6'),
            'jackpot': float(result.get('jackpot')) if result.get('jackpot') else None,
            'winners': result.get('winners')
        })
    
    df = pd.DataFrame(data)
    
    # Convert draw_date to datetime if it's a string
    if not df.empty and 'draw_date' in df.columns:
        df['draw_date'] = pd.to_datetime(df['draw_date'], errors='coerce')
    
    return df

def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract features from historical data for ML models.
    
    Args:
        df: DataFrame with historical results
        
    Returns:
        DataFrame with extracted features
    """
    if df.empty:
        return pd.DataFrame()
    
    # Sort by date ascending for proper feature extraction
    df = df.sort_values('draw_date').reset_index(drop=True)
    
    features = []
    
    for idx in range(len(df)):
        row = df.iloc[idx]
        
        numbers = [row['number_1'], row['number_2'], row['number_3'],
                   row['number_4'], row['number_5'], row['number_6']]
        numbers_sorted = sorted(numbers)
        
        # Basic features
        feature_dict = {
            'sum': sum(numbers),
            'product': np.prod(numbers),
            'mean': np.mean(numbers),
            'std': np.std(numbers),
            'min': min(numbers),
            'max': max(numbers),
            'range': max(numbers) - min(numbers)
        }
        
        # Previous draw features (if available)
        if idx > 0:
            prev_row = df.iloc[idx - 1]
            prev_numbers = sorted([prev_row['number_1'], prev_row['number_2'],
                                  prev_row['number_3'], prev_row['number_4'],
                                  prev_row['number_5'], prev_row['number_6']])
            
            feature_dict['prev_sum'] = sum(prev_numbers)
            feature_dict['prev_mean'] = np.mean(prev_numbers)
            feature_dict['sum_diff'] = feature_dict['sum'] - feature_dict['prev_sum']
        else:
            feature_dict['prev_sum'] = None
            feature_dict['prev_mean'] = None
            feature_dict['sum_diff'] = None
        
        # Individual number features
        for i, num in enumerate(numbers_sorted):
            feature_dict[f'number_{i+1}'] = num
        
        features.append(feature_dict)
    
    return pd.DataFrame(features)

def prepare_training_data(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """
    Prepare training data for ML models.
    
    Args:
        df: DataFrame with features
        
    Returns:
        Tuple of (X, y) where X is features and y is target (numbers)
    """
    if df.empty:
        return np.array([]), np.array([])
    
    # Extract number columns
    number_cols = [col for col in df.columns if col.startswith('number_')]
    
    if not number_cols:
        return np.array([]), np.array([])
    
    # Features (everything except number columns)
    feature_cols = [col for col in df.columns if col not in number_cols]
    X = df[feature_cols].fillna(0).values
    
    # Target (numbers)
    y = df[number_cols].values
    
    return X, y
