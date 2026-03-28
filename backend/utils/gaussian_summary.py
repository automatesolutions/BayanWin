"""Historical draw-sum and draw-product statistics (Miro context / APIs)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from services.instantdb_client import instantdb


def _collect_sums_and_products(
    game_type: str, limit: int = 10000, order_by: str = "draw_date.asc"
) -> Tuple[List[int], List[int]]:
    """One DB read: per-draw sum and product of six winning numbers."""
    rows = instantdb.get_results(game_type, limit=limit, offset=0, order_by=order_by)
    sums: List[int] = []
    products: List[int] = []
    for result in rows:
        numbers = [
            result.get("number_1"),
            result.get("number_2"),
            result.get("number_3"),
            result.get("number_4"),
            result.get("number_5"),
            result.get("number_6"),
        ]
        numbers = [n for n in numbers if n is not None]
        if len(numbers) != 6:
            continue
        try:
            nums = [int(x) for x in numbers]
        except (TypeError, ValueError):
            continue
        sums.append(sum(nums))
        prod = 1
        for n in nums:
            prod *= n
        products.append(prod)
    return sums, products


def draw_sums_from_results(game_type: str, limit: int = 10000, order_by: str = "draw_date.asc") -> List[int]:
    """Per-draw sum of six winning numbers."""
    sums, _ = _collect_sums_and_products(game_type, limit, order_by)
    return sums


def gaussian_distribution_bands(game_type: str, limit: int = 10000) -> Optional[Dict[str, Any]]:
    """
    Sum and product bands over historical draws (aligns with /api/stats/.../gaussian statistics).
    Product side includes log_mean / log_std on log(product) for stable scale.
    """
    sums, products = _collect_sums_and_products(game_type, limit)
    if not sums or not products or len(sums) != len(products):
        return None

    sum_arr = np.array(sums, dtype=float)
    prod_arr = np.array(products, dtype=float)
    log_products = [np.log(p) if p > 0 else 0.0 for p in products]

    return {
        "sum": {
            "mean": float(np.mean(sum_arr)),
            "std": float(np.std(sum_arr)),
            "min": int(min(sums)),
            "max": int(max(sums)),
            "count": len(sums),
        },
        "product": {
            "mean": float(np.mean(prod_arr)),
            "std": float(np.std(prod_arr)),
            "min": int(min(products)),
            "max": int(max(products)),
            "log_mean": float(np.mean(log_products)),
            "log_std": float(np.std(log_products)),
            "count": len(products),
        },
    }


def gaussian_sum_statistics(game_type: str, limit: int = 10000) -> Optional[Dict[str, Any]]:
    """Mean/std/min/max/count for sums of winning numbers."""
    bands = gaussian_distribution_bands(game_type, limit)
    if not bands:
        return None
    return bands.get("sum")
