"""Error distance calculation utilities - Using InstantDB."""
import numpy as np
from typing import List, Dict
from datetime import datetime

def calculate_euclidean_distance(predicted: List[int], actual: List[int]) -> float:
    """Calculate Euclidean distance between two number sets."""
    pred_arr = np.array(sorted(predicted))
    actual_arr = np.array(sorted(actual))
    return float(np.linalg.norm(pred_arr - actual_arr))

def calculate_manhattan_distance(predicted: List[int], actual: List[int]) -> float:
    """Calculate Manhattan distance between two number sets."""
    pred_arr = np.array(sorted(predicted))
    actual_arr = np.array(sorted(actual))
    return float(np.sum(np.abs(pred_arr - actual_arr)))

def calculate_hamming_distance(predicted: List[int], actual: List[int]) -> int:
    """Calculate Hamming distance (count of positions where numbers differ)."""
    pred_set = set(sorted(predicted))
    actual_set = set(sorted(actual))
    return len(pred_set.symmetric_difference(actual_set))

def calculate_set_intersection(predicted: List[int], actual: List[int]) -> int:
    """Count matching numbers between predicted and actual sets."""
    pred_set = set(predicted)
    actual_set = set(actual)
    return len(pred_set.intersection(actual_set))

def calculate_sum_difference(predicted: List[int], actual: List[int]) -> float:
    """Calculate absolute difference in sum of numbers."""
    return abs(sum(predicted) - sum(actual))

def calculate_product_difference(predicted: List[int], actual: List[int]) -> float:
    """Calculate absolute difference in product of numbers."""
    pred_product = np.prod(predicted)
    actual_product = np.prod(actual)
    return abs(pred_product - actual_product)

def calculate_all_metrics(predicted: List[int], actual: List[int]) -> Dict:
    """
    Calculate all distance metrics and return as dictionary.
    
    Args:
        predicted: List of 6 predicted numbers
        actual: List of 6 actual numbers
        
    Returns:
        Dictionary with all distance metrics
    """
    return {
        'euclidean_distance': calculate_euclidean_distance(predicted, actual),
        'manhattan_distance': calculate_manhattan_distance(predicted, actual),
        'hamming_distance': calculate_hamming_distance(predicted, actual),
        'set_intersection': calculate_set_intersection(predicted, actual),
        'sum_difference': calculate_sum_difference(predicted, actual),
        'product_difference': calculate_product_difference(predicted, actual)
    }

# store_prediction_accuracy removed - now handled directly in app.py using InstantDB client

