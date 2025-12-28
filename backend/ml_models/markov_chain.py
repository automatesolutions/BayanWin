"""Markov Chain prediction model for lottery numbers."""
import numpy as np
from collections import defaultdict
from typing import List, Dict, Tuple
# Removed SQLAlchemy - using InstantDB
from utils.data_processor import get_historical_data
from config import Config

class MarkovChainModel:
    """Markov Chain model for predicting lottery number sequences."""
    
    def __init__(self):
        self.transition_matrix = None
        self.states = None
        self.is_trained = False
        
    def train(self, game_type: str):
        """
        Train the Markov Chain model on historical data.
        
        Args:
            game_type: Game type identifier
            db: Database session
        """
        # Get historical data
        df = get_historical_data(game_type)
        
        if df.empty or len(df) < 10:
            raise ValueError("Insufficient historical data for training")
        
        # Sort by date ascending
        df = df.sort_values('draw_date').reset_index(drop=True)
        
        max_number = Config.GAMES[game_type]['max_number']
        
        # Build transition matrix: state -> next state probabilities
        # State is represented as sorted tuple of numbers
        transitions = defaultdict(lambda: defaultdict(int))
        state_counts = defaultdict(int)
        
        prev_state = None
        
        for idx in range(len(df)):
            row = df.iloc[idx]
            numbers = sorted([row['number_1'], row['number_2'], row['number_3'],
                             row['number_4'], row['number_5'], row['number_6']])
            current_state = tuple(numbers)
            
            if prev_state is not None:
                transitions[prev_state][current_state] += 1
                state_counts[prev_state] += 1
            
            prev_state = current_state
        
        # Convert to probability matrix
        self.transition_matrix = {}
        for state, next_states in transitions.items():
            total = state_counts[state]
            self.transition_matrix[state] = {
                next_state: count / total
                for next_state, count in next_states.items()
            }
        
        self.states = list(self.transition_matrix.keys())
        self.is_trained = True
    
    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction for next draw using Markov Chain.
        
        Args:
            game_type: Game type identifier
            db: Database session
            
        Returns:
            List of 6 predicted numbers
        """
        if not self.is_trained:
            self.train(game_type)
        
        # Get latest state
        df = get_historical_data(game_type, db, limit=1)
        
        if df.empty or not self.states:
            # Fallback to frequency-based
            from utils.frequency_analysis import calculate_frequency
            frequency = calculate_frequency(game_type, db)
            sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
            return [num for num, _ in sorted_numbers[:6]]
        
        latest_row = df.iloc[0]
        current_state = tuple(sorted([
            latest_row['number_1'], latest_row['number_2'], latest_row['number_3'],
            latest_row['number_4'], latest_row['number_5'], latest_row['number_6']
        ]))
        
        # Find most likely next state
        if current_state in self.transition_matrix:
            next_states = self.transition_matrix[current_state]
            if next_states:
                # Get state with highest probability
                most_likely_state = max(next_states.items(), key=lambda x: x[1])[0]
                return list(most_likely_state)
        
        # If no transition found, use most common state
        if self.states:
            # Find most frequent state
            state_freq = {}
            for state in self.states:
                state_freq[state] = sum(self.transition_matrix.get(state, {}).values())
            
            if state_freq:
                most_common_state = max(state_freq.items(), key=lambda x: x[1])[0]
                return list(most_common_state)
        
        # Final fallback
        from utils.frequency_analysis import calculate_frequency
        frequency = calculate_frequency(game_type, db)
        sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
        return [num for num, _ in sorted_numbers[:6]]

