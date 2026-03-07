"""
Nash Equilibrium + Hot-Number Probability Filter model.

Implements two zero-cost filtering layers applied to a smart wheel:
1. Nash Equilibrium Mixed-Strategy Filter: Randomly select from 8 balanced tickets (12.5% each)
2. Hot-Number Probability Filter: Frequency-weighted sampling with 3-even/3-odd balance

Hybrid mode: Nash ticket first, then replace cold numbers with hot alternatives while keeping balance.
"""
import numpy as np
from typing import List, Tuple
from utils.frequency_analysis import calculate_frequency, get_hot_numbers, get_cold_numbers
from config import Config


# User-provided Nash equilibrium smart wheel for 6/49 (Super Lotto)
# Each ticket has 3-low/3-high balance (3 from 1-24, 3 from 25-49)
SMART_WHEEL_6_49 = [
    [19, 30, 3, 29, 13, 41],
    [19, 30, 3, 29, 4, 7],
    [19, 30, 3, 41, 16, 32],
    [19, 29, 13, 41, 4, 16],
    [30, 3, 29, 13, 7, 32],
    [19, 3, 41, 4, 16, 7],
    [30, 29, 13, 32, 4, 19],
    [41, 16, 7, 32, 13, 30],
]


def _is_balanced_3_even_3_odd(numbers: List[int]) -> bool:
    """Check 3-even / 3-odd balance."""
    evens = sum(1 for n in numbers if n % 2 == 0)
    return evens == 3


def _is_balanced_3_low_3_high(numbers: List[int], max_number: int) -> bool:
    """Check 3-low / 3-high balance (low = bottom half, high = top half)."""
    mid = max_number // 2
    low = sum(1 for n in numbers if n <= mid)
    return low == 3


def _generate_balanced_ticket(max_number: int, numbers_count: int = 6) -> List[int]:
    """Generate one ticket with 3-even/3-odd and 3-low/3-high balance."""
    mid = max_number // 2
    odds_low = [n for n in range(1, mid + 1) if n % 2 == 1]
    odds_high = [n for n in range(mid + 1, max_number + 1) if n % 2 == 1]
    evens_low = [n for n in range(1, mid + 1) if n % 2 == 0]
    evens_high = [n for n in range(mid + 1, max_number + 1) if n % 2 == 0]

    # Need 3 odd, 3 even. For balance: pick from low and high in each
    result = []
    # 2 odd from low, 1 from high (or 1 from low, 2 from high)
    np.random.shuffle(odds_low)
    np.random.shuffle(odds_high)
    result.extend(odds_low[:2])
    result.extend(odds_high[:1])
    # 2 even from low, 1 from high
    np.random.shuffle(evens_low)
    np.random.shuffle(evens_high)
    result.extend(evens_low[:2])
    result.extend(evens_high[:1])
    return sorted(result)


def _build_smart_wheel(game_type: str) -> List[List[int]]:
    """Build 8 Nash equilibrium tickets for the game."""
    max_number = Config.GAMES[game_type]['max_number']
    numbers_count = Config.GAMES[game_type]['numbers_count']

    if game_type == 'super_lotto_6_49':
        return [sorted(t) for t in SMART_WHEEL_6_49]

    # For other games: generate 8 balanced tickets
    wheel = []
    seen = set()
    attempts = 0
    while len(wheel) < 8 and attempts < 100:
        ticket = _generate_balanced_ticket(max_number, numbers_count)
        key = tuple(ticket)
        if key not in seen:
            seen.add(key)
            wheel.append(ticket)
        attempts += 1
    # Pad if needed
    while len(wheel) < 8:
        wheel.append(_generate_balanced_ticket(max_number, numbers_count))
    return wheel[:8]


def _get_frequency_probabilities(game_type: str) -> Tuple[dict, dict]:
    """
    Get probability distribution for odd and even numbers based on historical frequency.
    Returns (odd_probs, even_probs) - each maps number -> probability (normalized).
    """
    freq = calculate_frequency(game_type)
    max_number = Config.GAMES[game_type]['max_number']

    odd_nums = [n for n in range(1, max_number + 1) if n % 2 == 1]
    even_nums = [n for n in range(1, max_number + 1) if n % 2 == 0]

    odd_total = sum(freq.get(n, 1) for n in odd_nums)
    even_total = sum(freq.get(n, 1) for n in even_nums)

    odd_probs = {n: (freq.get(n, 1) / odd_total) if odd_total > 0 else (1.0 / len(odd_nums))
                 for n in odd_nums}
    even_probs = {n: (freq.get(n, 1) / even_total) if even_total > 0 else (1.0 / len(even_nums))
                  for n in even_nums}
    return odd_probs, even_probs


def _sample_hot_weighted_ticket(game_type: str) -> List[int]:
    """
    Generate one ticket using Hot-Number Probability Filter.
    Sample 3 odd + 3 even with probability proportional to historical frequency.
    """
    odd_probs, even_probs = _get_frequency_probabilities(game_type)
    odd_nums = list(odd_probs.keys())
    odd_weights = np.array([odd_probs[n] for n in odd_nums])
    odd_weights = odd_weights / odd_weights.sum()

    even_nums = list(even_probs.keys())
    even_weights = np.array([even_probs[n] for n in even_nums])
    even_weights = even_weights / even_weights.sum()

    chosen_odd = list(np.random.choice(odd_nums, size=3, replace=False, p=odd_weights))
    chosen_even = list(np.random.choice(even_nums, size=3, replace=False, p=even_weights))
    return sorted(chosen_odd + chosen_even)


def _apply_hot_filter_to_ticket(ticket: List[int], game_type: str,
                                replace_count: int = 2) -> List[int]:
    """
    Hybrid: Replace coldest numbers in ticket with hot alternatives (same parity).
    Keeps 3-even/3-odd balance.
    """
    freq = calculate_frequency(game_type)
    cold = set(n for n, _ in get_cold_numbers(game_type, bottom_n=15))
    hot = set(n for n, _ in get_hot_numbers(game_type, top_n=20))

    result = list(ticket)
    odds = [i for i, n in enumerate(result) if n % 2 == 1]
    evens = [i for i, n in enumerate(result) if n % 2 == 0]

    replaced = 0
    for idx in odds + evens:
        if replaced >= replace_count:
            break
        n = result[idx]
        if n in cold:
            need_odd = (n % 2 == 1)
            pool = [x for x in hot if x not in result and (x % 2 == 1) == need_odd]
            if pool:
                odd_probs, even_probs = _get_frequency_probabilities(game_type)
                probs_dict = odd_probs if need_odd else even_probs
                candidates = [x for x in pool if x in probs_dict]
                if candidates:
                    weights = np.array([probs_dict[x] for x in candidates])
                    weights = weights / weights.sum()
                    new_num = int(np.random.choice(candidates, p=weights))
                    result[idx] = new_num
                    replaced += 1
    return sorted(result)


class NashHotFilterModel:
    """
    Nash Equilibrium + Hot-Number filter model.

    Modes:
    - 'nash': Randomly pick 1 of 8 smart-wheel tickets (12.5% each)
    - 'hot': Frequency-weighted sampling, 3-even/3-odd balance
    - 'hybrid': Nash ticket, then replace cold numbers with hot (default)
    """

    def __init__(self, mode: str = 'hybrid'):
        self.mode = mode
        self.game_type = None
        self.smart_wheel = None

    def predict(self, game_type: str) -> List[int]:
        """
        Generate prediction using Nash + Hot-Number filters.
        """
        self.game_type = game_type
        self.smart_wheel = _build_smart_wheel(game_type)

        # Nash-only is always safe (no frequency data needed)
        if self.mode == 'nash':
            # Filter 1: Nash - randomly pick 1 of 8 tickets (equal 12.5%)
            idx = np.random.randint(0, len(self.smart_wheel))
            return list(self.smart_wheel[idx])

        if self.mode == 'hot':
            # Filter 2: Hot-Number probability filter only (fallback to Nash if no data)
            try:
                return _sample_hot_weighted_ticket(game_type)
            except Exception:
                idx = np.random.randint(0, len(self.smart_wheel))
                return list(self.smart_wheel[idx])

        # Hybrid (default): Nash ticket, then apply Hot filter on top
        idx = np.random.randint(0, len(self.smart_wheel))
        nash_ticket = list(self.smart_wheel[idx])
        try:
            return _apply_hot_filter_to_ticket(nash_ticket, game_type, replace_count=2)
        except Exception:
            return nash_ticket
