"""
Markov Chain prediction model for lottery numbers.

Uses two improved state definitions:
1. Delta System States: States based on spacing between numbers (deltas) rather than raw numbers
2. Latent Space Representations: Probabilistic states (μ, σ) for uncertainty quantification
"""
import numpy as np
from collections import defaultdict
from typing import List, Dict, Tuple, Optional
from utils.data_processor import get_historical_data
from config import Config

# Optional: sklearn for latent space (PCA + clustering)
try:
    from sklearn.decomposition import PCA
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


def numbers_to_deltas(numbers: Tuple[int, ...]) -> Tuple[int, ...]:
    """
    Convert sorted winning numbers to delta (spacing) representation.
    
    Example: (1, 5, 12, 23, 34, 58) -> (4, 7, 11, 11, 24)
    Deltas capture the gap structure between consecutive numbers.
    
    Args:
        numbers: Sorted tuple of 6 numbers
        
    Returns:
        Tuple of 5 deltas
    """
    if len(numbers) < 2:
        return ()
    return tuple(numbers[i + 1] - numbers[i] for i in range(len(numbers) - 1))


def deltas_to_numbers(deltas: Tuple[int, ...], max_number: int, 
                      start_offset: int = 0) -> List[int]:
    """
    Convert deltas back to valid lottery numbers.
    
    Uses start_offset to vary the starting number within valid range,
    ensuring all numbers stay in [1, max_number].
    
    Args:
        deltas: Tuple of 5 deltas
        max_number: Maximum number in the game
        start_offset: Offset for starting number (0 = minimum valid start)
        
    Returns:
        List of 6 sorted unique numbers
    """
    if len(deltas) != 5:
        raise ValueError("Need exactly 5 deltas for 6 numbers")
    
    # Ensure positive deltas
    deltas = tuple(max(1, int(d)) for d in deltas)
    delta_sum = sum(deltas)
    max_start = max(1, max_number - delta_sum)
    
    if max_start < 1:
        # Scale deltas down to fit range
        scale = (max_number - 6) / (delta_sum + 1e-6)
        deltas = tuple(max(1, int(d * scale)) for d in deltas)
        delta_sum = sum(deltas)
        max_start = max(1, max_number - delta_sum)
    
    n1 = min(1 + start_offset, max_start)
    n1 = max(1, n1)
    
    numbers = [n1]
    for d in deltas:
        next_num = numbers[-1] + d
        # Ensure strictly increasing to avoid duplicates
        if next_num <= numbers[-1]:
            next_num = numbers[-1] + 1
        numbers.append(min(next_num, max_number))
    
    # Ensure exactly 6 unique numbers
    result = []
    seen = set()
    for n in numbers:
        if n not in seen and 1 <= n <= max_number:
            result.append(n)
            seen.add(n)
    
    # Fill missing slots with unused numbers
    for n in range(1, max_number + 1):
        if len(result) >= 6:
            break
        if n not in seen:
            result.append(n)
            seen.add(n)
    
    return sorted(result)[:6]


def bucket_deltas(deltas: Tuple[int, ...], n_buckets: int = 5, 
                 max_delta: int = 57) -> Tuple[int, ...]:
    """
    Bucket deltas to reduce state space and capture pattern categories.
    
    Uses fixed bucket boundaries for consistency. Deltas typically range 1 to max_number-1.
    
    Args:
        deltas: Raw delta tuple
        n_buckets: Number of buckets (default 5: very_small, small, medium, large, very_large)
        max_delta: Expected max delta (default 57 for 6/58 game)
        
    Returns:
        Tuple of bucketed delta indices (0 to n_buckets-1)
    """
    if not deltas:
        return ()
    
    # Fixed bucket boundaries for consistent state matching
    bucket_size = max(1, max_delta // n_buckets)
    
    bucketed = []
    for d in deltas:
        bucket = min(d // bucket_size, n_buckets - 1)
        bucketed.append(bucket)
    
    return tuple(bucketed)


class MarkovChainModel:
    """
    Markov Chain model with Delta System and Probabilistic Latent States.
    
    State Definitions:
    1. Delta System: States = bucketed delta patterns (spacing between numbers)
    2. Probabilistic: Next-state distributions stored as (μ, σ) for uncertainty
    """
    
    def __init__(self, delta_buckets: int = None, use_latent_space: bool = None,
                 n_latent_clusters: int = None):
        """
        Args:
            delta_buckets: Number of buckets for delta discretization (reduces state space)
            use_latent_space: Whether to use PCA + clustering for similar state matching
            n_latent_clusters: Number of clusters for latent space state abstraction
        """
        params = Config.MARKOV_CHAIN_PARAMS
        self.delta_buckets = delta_buckets if delta_buckets is not None else params.get('delta_buckets', 5)
        self.use_latent_space = (use_latent_space if use_latent_space is not None 
                                else params.get('use_latent_space', True)) and HAS_SKLEARN
        self.n_latent_clusters = (n_latent_clusters if n_latent_clusters is not None 
                                 else params.get('n_latent_clusters', 20))
        
        # Delta-based transition matrix: state -> {next_state: probability}
        self.transition_matrix = None
        # Probabilistic next-state: state -> {next_state: (count, mean_deltas, std_deltas)}
        self.probabilistic_transitions = None
        # Delta state -> original numbers mapping (for reverse lookup)
        self.state_to_numbers = None
        # All observed delta states
        self.states = None
        # Latent space: PCA model, scaler, cluster assignments
        self.pca_model = None
        self.scaler = None
        self.latent_clusters = None
        self.state_to_cluster = None
        
        self.game_type = None
        self.max_number = None
        self.is_trained = False
        
    def _get_numbers_from_row(self, row) -> Tuple[int, ...]:
        """Extract sorted numbers from a dataframe row."""
        numbers = sorted([
            int(row['number_1']), int(row['number_2']), int(row['number_3']),
            int(row['number_4']), int(row['number_5']), int(row['number_6'])
        ])
        return tuple(numbers)
    
    def _numbers_to_state(self, numbers: Tuple[int, ...]) -> Tuple:
        """Convert numbers to Markov state (bucketed deltas)."""
        deltas = numbers_to_deltas(numbers)
        max_delta = (self.max_number - 1) if self.max_number else 57
        return bucket_deltas(deltas, self.delta_buckets, max_delta)
    
    def train(self, game_type: str) -> None:
        """
        Train the Markov Chain on historical data using Delta System states.
        
        Builds:
        1. Transition matrix (delta state -> next delta state)
        2. Probabilistic distributions (μ, σ) for each delta position in next states
        3. Optional: Latent space clustering for similar state matching
        """
        df = get_historical_data(game_type)
        
        if df.empty or len(df) < 10:
            raise ValueError("Insufficient historical data for training")
        
        df = df.sort_values('draw_date').reset_index(drop=True)
        self.game_type = game_type
        self.max_number = Config.GAMES[game_type]['max_number']
        max_delta = self.max_number - 1
        
        # Build delta sequences and states
        delta_sequences = []
        transitions = defaultdict(lambda: defaultdict(lambda: {'count': 0, 'deltas_list': []}))
        state_counts = defaultdict(int)
        state_to_numbers_map = defaultdict(list)
        
        prev_state = None
        
        for idx in range(len(df)):
            row = df.iloc[idx]
            numbers = self._get_numbers_from_row(row)
            deltas = numbers_to_deltas(numbers)
            current_state = bucket_deltas(deltas, self.delta_buckets, max_delta)
            
            delta_sequences.append(deltas)
            state_to_numbers_map[current_state].append(numbers)
            
            if prev_state is not None:
                transitions[prev_state][current_state]['count'] += 1
                transitions[prev_state][current_state]['deltas_list'].append(deltas)
                state_counts[prev_state] += 1
            
            prev_state = current_state
        
        # Convert to probability matrix
        self.transition_matrix = {}
        self.probabilistic_transitions = {}
        
        for state, next_states in transitions.items():
            total = state_counts[state]
            self.transition_matrix[state] = {
                next_state: data['count'] / total
                for next_state, data in next_states.items()
            }
            
            # Build probabilistic (μ, σ) for each next state
            self.probabilistic_transitions[state] = {}
            for next_state, data in next_states.items():
                deltas_list = np.array(data['deltas_list'])
                mean_deltas = tuple(np.mean(deltas_list, axis=0))
                std_deltas = tuple(np.std(deltas_list, axis=0) + 0.5)  # Avoid zero std
                self.probabilistic_transitions[state][next_state] = {
                    'prob': data['count'] / total,
                    'mean': mean_deltas,
                    'std': std_deltas,
                    'count': data['count']
                }
        
        self.states = list(self.transition_matrix.keys())
        self.state_to_numbers = dict(state_to_numbers_map)
        
        # Latent space: PCA + KMeans on delta sequences
        if self.use_latent_space and len(delta_sequences) >= self.n_latent_clusters:
            try:
                X = np.array(delta_sequences)
                self.scaler = StandardScaler()
                X_scaled = self.scaler.fit_transform(X)
                
                n_components = min(3, X.shape[1], X.shape[0] - 1)
                self.pca_model = PCA(n_components=n_components, random_state=42)
                X_latent = self.pca_model.fit_transform(X_scaled)
                
                n_clusters = min(self.n_latent_clusters, len(X_latent))
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                cluster_labels = kmeans.fit_predict(X_latent)
                
                self.state_to_cluster = {}
                for idx, deltas in enumerate(delta_sequences):
                    if idx < len(cluster_labels):
                        state = bucket_deltas(tuple(deltas), self.delta_buckets, max_delta)
                        self.state_to_cluster[state] = int(cluster_labels[idx])
            except Exception:
                self.use_latent_space = False
        
        self.is_trained = True
    
    def _find_similar_state(self, state: Tuple) -> Optional[Tuple]:
        """
        Find a similar state when exact match fails.
        Uses latent space cluster if available, else nearest by delta pattern (L1).
        """
        if not self.states:
            return None
        
        # Find state with minimum L1 distance in bucket space
        state_arr = np.array(state)
        best_state = None
        best_dist = float('inf')
        
        for s in self.states:
            s_arr = np.array(s)
            dist = np.sum(np.abs(state_arr - s_arr))
            if dist < best_dist:
                best_dist = dist
                best_state = s
        
        return best_state
    
    def _sample_from_distribution(self, mean_deltas: Tuple, std_deltas: Tuple) -> Tuple[int, ...]:
        """Sample deltas from N(μ, σ) distribution for probabilistic prediction."""
        sampled = []
        for mu, sigma in zip(mean_deltas, std_deltas):
            val = int(np.round(np.random.normal(mu, max(sigma, 0.5))))
            val = max(1, val)  # Deltas must be positive
            sampled.append(val)
        return tuple(sampled)
    
    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction using Delta System + Probabilistic states.
        
        Strategy:
        1. Get latest draw, convert to delta state
        2. If exact state in matrix: use probabilistic sampling from (μ, σ) of next states
        3. If not found: find similar state
        4. Fallback: frequency-based prediction
        """
        if not self.is_trained or self.game_type != game_type:
            self.train(game_type)
        
        df = get_historical_data(game_type, limit=1)
        
        if df.empty or not self.states:
            return self._frequency_fallback(game_type)
        
        latest_row = df.iloc[0]
        numbers = self._get_numbers_from_row(latest_row)
        current_state = self._numbers_to_state(numbers)
        
        # Try exact match first
        if current_state in self.transition_matrix:
            next_states_data = self.probabilistic_transitions[current_state]
            
            # Probabilistic sampling: weight by probability, then sample from (μ, σ)
            next_states = list(next_states_data.items())
            probs = np.array([x[1]['prob'] for x in next_states])
            probs = probs / probs.sum()
            
            # Sample from the distribution (probabilistic state)
            idx = np.random.choice(len(next_states), p=probs)
            chosen_next = next_states[idx][1]
            mean_d, std_d = chosen_next['mean'], chosen_next['std']
            
            # Sample deltas from N(μ, σ)
            sampled_deltas = self._sample_from_distribution(mean_d, std_d)
            
            # Convert to numbers (try a few start offsets for validity)
            for offset in range(0, min(10, self.max_number)):
                try:
                    result = deltas_to_numbers(sampled_deltas, self.max_number, offset)
                    if len(result) == 6 and all(1 <= n <= self.max_number for n in result):
                        return sorted(result)
                except (ValueError, Exception):
                    continue
            
            # If sampling failed, use most likely next state's representative numbers
            most_likely = max(next_states_data.items(), key=lambda x: x[1]['prob'])[0]
            if most_likely in self.state_to_numbers and self.state_to_numbers[most_likely]:
                nums = self.state_to_numbers[most_likely][0]
                return list(nums)
        
        # Try similar state
        similar_state = self._find_similar_state(current_state)
        if similar_state and similar_state in self.transition_matrix:
            next_states_data = self.probabilistic_transitions[similar_state]
            most_likely = max(next_states_data.items(), key=lambda x: x[1]['prob'])[0]
            if most_likely in self.state_to_numbers and self.state_to_numbers[most_likely]:
                return list(self.state_to_numbers[most_likely][0])
        
        # Use most common state overall
        if self.states:
            state_freq = {}
            for state in self.states:
                state_freq[state] = sum(self.transition_matrix.get(state, {}).values())
            if state_freq:
                most_common = max(state_freq.items(), key=lambda x: x[1])[0]
                if most_common in self.state_to_numbers and self.state_to_numbers[most_common]:
                    return list(self.state_to_numbers[most_common][0])
        
        return self._frequency_fallback(game_type)
    
    def _frequency_fallback(self, game_type: str) -> List[int]:
        """Fallback to frequency-based prediction."""
        from utils.frequency_analysis import calculate_frequency
        frequency = calculate_frequency(game_type)
        sorted_numbers = sorted(frequency.items(), key=lambda x: x[1], reverse=True)
        return [int(num) for num, _ in sorted_numbers[:6]]
