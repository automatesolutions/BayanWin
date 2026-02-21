"""
Anomaly Detection model using Stanley Ulam's Monte Carlo method.

Applies Ulam's philosophy: simulation over exact calculation, empirical distribution
over Gaussian assumption, Markov chain transitions, and uncertainty quantification (σ).
"""
import numpy as np
from collections import defaultdict, Counter
from typing import List, Tuple, Dict, Optional
from utils.data_processor import get_historical_data
from config import Config


def _get_numbers_from_row(row) -> List[int]:
    """Extract numbers from a dataframe row."""
    return [
        int(row['number_1']), int(row['number_2']), int(row['number_3']),
        int(row['number_4']), int(row['number_5']), int(row['number_6'])
    ]


def _sum_product(numbers: List[int]) -> Tuple[float, float]:
    """Compute sum and log(product) for numerical stability."""
    s = sum(numbers)
    p = np.prod(numbers)
    log_p = np.log(p) if p > 0 else 0
    return s, log_p


def _discretize_state(sum_val: float, product_log: float,
                      sum_min: float, sum_max: float,
                      sum_buckets: int, product_buckets: int,
                      log_product_min: float = 5, log_product_max: float = 25) -> Tuple[int, int]:
    """Discretize (sum, log_product) into bucket indices for Markov states."""
    sum_range = max(sum_max - sum_min, 1)
    sum_bucket = int((sum_val - sum_min) / sum_range * sum_buckets)
    sum_bucket = np.clip(sum_bucket, 0, sum_buckets - 1)
    prod_range = max(log_product_max - log_product_min, 1)
    product_bucket = int((product_log - log_product_min) / prod_range * product_buckets)
    product_bucket = np.clip(product_bucket, 0, product_buckets - 1)
    return (sum_bucket, product_bucket)


class AnomalyDetectionModel:
    """
    Monte Carlo / Ulam-style model for lottery prediction.
    
    Features:
    1. Large-scale simulation (1M+ candidates)
    2. Empirical distribution (histogram) instead of Gaussian
    3. Markov chain transition logic for (sum, product) states
    4. Uncertainty quantification (μ ± σ)
    5. Guard rails (sum range 100-250 or historical percentiles)
    """
    
    def __init__(self):
        self.params = Config.ANOMALY_DETECTION_PARAMS
        self.game_type = None
        self.max_number = None
        self.numbers_count = None
        
        # Empirical distribution: histogram of (sum, log_product) from Monte Carlo
        self.empirical_histogram = None
        self.hist_sum_bins = None
        self.hist_product_bins = None
        
        # Historical (sum, log_product) for comparison and statistics
        self.historical_sums = None
        self.historical_log_products = None
        self.hist_mean_sum = None
        self.hist_std_sum = None
        self.hist_mean_log_product = None
        self.hist_std_log_product = None
        
        # Guard rails
        self.sum_min = None
        self.sum_max = None
        
        # Markov transition matrix: state -> {next_state: probability}
        self.transition_matrix = None
        self.log_product_min = None
        self.log_product_max = None
        
        self.is_trained = False
    
    def train(self, game_type: str) -> None:
        """
        Train using Ulam's method: build empirical distribution and Markov transitions.
        """
        df = get_historical_data(game_type)
        
        if df.empty or len(df) < 10:
            raise ValueError("Insufficient historical data for training")
        
        df = df.sort_values('draw_date').reset_index(drop=True)
        self.game_type = game_type
        self.max_number = Config.GAMES[game_type]['max_number']
        self.numbers_count = Config.GAMES[game_type]['numbers_count']
        
        # Extract historical (sum, log_product)
        historical_points = []
        for idx in range(len(df)):
            numbers = _get_numbers_from_row(df.iloc[idx])
            s, log_p = _sum_product(numbers)
            historical_points.append((s, log_p))
        
        sums = [p[0] for p in historical_points]
        log_products = [p[1] for p in historical_points]
        
        self.historical_sums = np.array(sums)
        self.historical_log_products = np.array(log_products)
        self.hist_mean_sum = np.mean(sums)
        self.hist_std_sum = np.std(sums) or 1
        self.hist_mean_log_product = np.mean(log_products)
        self.hist_std_log_product = np.std(log_products) or 1
        
        # Guard rails: use historical percentiles or config
        if self.params.get('use_historical_sum_range', True):
            self.sum_min = max(21, int(np.percentile(sums, 5)))
            self.sum_max = min(6 * self.max_number - 15, int(np.percentile(sums, 95)))
        else:
            self.sum_min = self.params.get('sum_min', 100)
            self.sum_max = self.params.get('sum_max', 250)
        if self.sum_min >= self.sum_max:
            self.sum_min = max(21, int(np.mean(sums)) - 50)
            self.sum_max = min(6 * self.max_number - 15, int(np.mean(sums)) + 50)
        
        # 1. Build empirical distribution via Monte Carlo simulation (Ulam: simulate over calculate)
        n_sim = min(500_000, self.params.get('n_candidates', 1_000_000) // 2)
        sim_sums = []
        sim_log_products = []
        
        for _ in range(n_sim):
            candidate = sorted(np.random.choice(
                range(1, self.max_number + 1),
                size=self.numbers_count,
                replace=False
            ))
            s, log_p = _sum_product(candidate)
            if self.sum_min <= s <= self.sum_max:
                sim_sums.append(s)
                sim_log_products.append(log_p)
        
        if len(sim_sums) >= 100:
            self.empirical_histogram = np.histogram2d(
                sim_sums, sim_log_products,
                bins=[50, 50]
            )[0]
            self.hist_sum_bins = np.linspace(min(sim_sums), max(sim_sums), 51)
            self.hist_product_bins = np.linspace(min(sim_log_products), max(sim_log_products), 51)
        else:
            self.empirical_histogram = None
        
        # 2. Build Markov transition matrix: state_t -> state_t+1
        sum_buckets = self.params.get('sum_buckets', 15)
        product_buckets = self.params.get('product_buckets', 20)
        log_p_min = float(np.min(log_products))
        log_p_max = float(np.max(log_products))
        
        transitions = defaultdict(lambda: defaultdict(int))
        prev_state = None
        
        for idx in range(len(historical_points)):
            s, log_p = historical_points[idx]
            state = _discretize_state(
                s, log_p, self.sum_min, self.sum_max,
                sum_buckets, product_buckets, log_p_min, log_p_max
            )
            if prev_state is not None:
                transitions[prev_state][state] += 1
            prev_state = state
        
        self.transition_matrix = {}
        for state, next_states in transitions.items():
            total = sum(next_states.values())
            self.transition_matrix[state] = {
                ns: count / total for ns, count in next_states.items()
            }
        
        self.log_product_min = log_p_min
        self.log_product_max = log_p_max
        self.is_trained = True
    
    def _score_with_empirical(self, sum_val: float, log_product: float) -> float:
        """Score a (sum, log_product) point using empirical histogram."""
        if self.empirical_histogram is None:
            return 0.0
        
        sum_idx = np.searchsorted(self.hist_sum_bins, sum_val, side='right') - 1
        product_idx = np.searchsorted(self.hist_product_bins, log_product, side='right') - 1
        sum_idx = np.clip(sum_idx, 0, self.empirical_histogram.shape[0] - 1)
        product_idx = np.clip(product_idx, 0, self.empirical_histogram.shape[1] - 1)
        
        count = self.empirical_histogram[sum_idx, product_idx]
        total = np.sum(self.empirical_histogram)
        if total > 0:
            return count / total
        return 0.0
    
    def _score_historical_deviation(self, sum_val: float, log_product: float) -> float:
        """
        Score based on how well (sum, log_product) matches historical distribution.
        Higher = closer to historical mean, within observed variance.
        """
        sum_z = abs(sum_val - self.hist_mean_sum) / self.hist_std_sum
        product_z = abs(log_product - self.hist_mean_log_product) / self.hist_std_log_product
        combined_z = np.sqrt(sum_z**2 + product_z**2)
        return 1.0 / (1.0 + combined_z)
    
    def predict(self, game_type: str) -> List[int]:
        """
        Predict using Ulam's Monte Carlo method with:
        - 1M+ candidate generation (batched)
        - Guard rail filtering (sum range)
        - Empirical + historical scoring
        - Markov chain transition guidance
        - Uncertainty band (μ ± σ) for final selection
        """
        if not self.is_trained or self.game_type != game_type:
            self.train(game_type)
        
        max_number = self.max_number
        numbers_count = self.numbers_count
        batch_size = self.params.get('batch_size', 50_000)
        n_candidates = self.params.get('n_candidates', 1_000_000)
        sigma_band = self.params.get('sigma_band', 1.5)
        
        # Chain-based Monte Carlo: run N simulations from latest state, find most frequent next state
        latest_df = get_historical_data(game_type, limit=1)
        n_markov_sims = self.params.get('n_markov_simulations', 10_000)
        
        if not latest_df.empty and self.transition_matrix and self.log_product_min is not None:
            numbers = _get_numbers_from_row(latest_df.iloc[0])
            s, log_p = _sum_product(numbers)
            prev_state = _discretize_state(
                s, log_p, self.sum_min, self.sum_max,
                self.params.get('sum_buckets', 15),
                self.params.get('product_buckets', 20),
                self.log_product_min, self.log_product_max
            )
            if prev_state in self.transition_matrix:
                next_states = self.transition_matrix[prev_state]
                states = list(next_states.keys())
                probs = np.array(list(next_states.values()))
                probs = probs / probs.sum()
                chain_results = np.random.choice(len(states), size=min(n_markov_sims, 5000), p=probs)
                state_counts = Counter(chain_results)
                most_common_idx = state_counts.most_common(1)[0][0]
                chosen_state = states[most_common_idx]
                sum_bucket, prod_bucket = chosen_state
                sum_range = self.sum_max - self.sum_min
        
        # Uncertainty band: accept candidates within μ ± σ*sigma_band
        sum_low = self.hist_mean_sum - sigma_band * self.hist_std_sum
        sum_high = self.hist_mean_sum + sigma_band * self.hist_std_sum
        sum_low = max(self.sum_min, sum_low)
        sum_high = min(self.sum_max, sum_high)
        
        # Batched Monte Carlo: generate and score millions of candidates (Ulam: simulation over calculation)
        top_candidates = []
        n_batches = min((n_candidates + batch_size - 1) // batch_size, 20)
        
        for _ in range(n_batches):
            batch_candidates = []
            for _ in range(batch_size):
                candidate = sorted(np.random.choice(
                    range(1, max_number + 1),
                    size=numbers_count,
                    replace=False
                ))
                s = sum(candidate)
                if s < self.sum_min or s > self.sum_max:
                    continue
                log_p = np.log(np.prod(candidate))
                
                emp_score = self._score_with_empirical(s, log_p)
                hist_score = self._score_historical_deviation(s, log_p)
                combined_score = 0.5 * emp_score + 0.5 * hist_score
                
                if sum_low <= s <= sum_high:
                    combined_score *= 1.2
                
                batch_candidates.append((candidate, combined_score, s))
            
            if batch_candidates:
                batch_candidates.sort(key=lambda x: x[1], reverse=True)
                top_candidates.extend(batch_candidates[:1000])
                top_candidates.sort(key=lambda x: x[1], reverse=True)
                top_candidates = top_candidates[:5000]
        
        if top_candidates:
            best = top_candidates[0][0]
            return [int(n) for n in best]
        
        # Fallback: sample within uncertainty band
        for _ in range(5000):
            candidate = sorted(np.random.choice(
                range(1, max_number + 1),
                size=numbers_count,
                replace=False
            ))
            s = sum(candidate)
            if self.sum_min <= s <= self.sum_max and sum_low <= s <= sum_high:
                return [int(n) for n in candidate]
        
        # Final fallback: mean-targeted
        mean_sum = int(self.hist_mean_sum)
        best_candidate = None
        best_diff = float('inf')
        for _ in range(1000):
            candidate = sorted(np.random.choice(
                range(1, max_number + 1),
                size=numbers_count,
                replace=False
            ))
            s = sum(candidate)
            if self.sum_min <= s <= self.sum_max:
                diff = abs(s - mean_sum)
                if diff < best_diff:
                    best_diff = diff
                    best_candidate = candidate
        if best_candidate:
            return [int(n) for n in best_candidate]
        
        return [int(n) for n in sorted(np.random.choice(
            range(1, max_number + 1),
            size=numbers_count,
            replace=False
        ))]
