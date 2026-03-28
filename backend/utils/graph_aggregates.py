"""Deterministic graph data for D3 co-occurrence, transition, and Sankey APIs."""
from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Tuple

from services.instantdb_client import instantdb
from utils.frequency_analysis import get_hot_numbers


def _result_numbers(r: Dict[str, Any]) -> List[int]:
    return [int(r[f"number_{i}"]) for i in range(1, 7)]


def _sort_results_by_date(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    def key_fn(r: Dict[str, Any]) -> Tuple:
        d = r.get("draw_date") or ""
        try:
            if isinstance(d, str) and "T" in d:
                return (datetime.fromisoformat(d.replace("Z", "+00:00")),)
            return (datetime.fromisoformat(str(d)[:10]),)
        except ValueError:
            return (datetime.min,)

    return sorted(results, key=key_fn)


def cooccurrence_edges(game_type: str, limit_draws: int = 2000) -> Dict[str, Any]:
    results = instantdb.get_results(game_type, limit=limit_draws, offset=0, order_by="draw_date.desc")
    pairs: Counter = Counter()
    for r in results:
        try:
            nums = sorted(_result_numbers(r))
        except (KeyError, TypeError, ValueError):
            continue
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                a, b = nums[i], nums[j]
                pairs[(a, b)] += 1

    edges = [
        {"source": a, "target": b, "weight": w}
        for (a, b), w in pairs.most_common(400)
    ]
    return {"game_type": game_type, "edges": edges, "draws_used": len(results)}


def markov_ball_transitions(game_type: str, limit_draws: int = 2000) -> Dict[str, Any]:
    """Directed counts: number x in draw t -> number y in draw t+1 (any pair between draws)."""
    results = instantdb.get_results(game_type, limit=limit_draws, offset=0, order_by="draw_date.asc")
    ordered = _sort_results_by_date(results)
    trans: Counter = Counter()
    for a, b in zip(ordered, ordered[1:]):
        try:
            na = set(_result_numbers(a))
            nb = set(_result_numbers(b))
        except (KeyError, TypeError, ValueError):
            continue
        for x in na:
            for y in nb:
                if x != y:
                    trans[(x, y)] += 1

    edges = [
        {"source": s, "target": t, "weight": w}
        for (s, t), w in trans.most_common(300)
    ]
    return {"game_type": game_type, "edges": edges, "transition_pairs": len(trans)}


def sankey_hot_model_votes(
    game_type: str,
    predictions_by_model: Dict[str, Any],
    hot_top_n: int = 12,
) -> Dict[str, Any]:
    hot = [n for n, _ in get_hot_numbers(game_type, top_n=hot_top_n)]
    hot_set = set(hot)

    left_hot = "hot_band"
    left_cold = "cold_band"
    nodes = [
        {"id": left_hot, "label": f"Hot (top {hot_top_n})"},
        {"id": left_cold, "label": "Other numbers"},
    ]
    model_ids: List[str] = []
    links: List[Dict[str, Any]] = []
    link_index: Dict[Tuple[str, str], int] = {}

    for model_name, payload in predictions_by_model.items():
        if not isinstance(payload, dict) or "error" in payload:
            continue
        nums = payload.get("numbers")
        if not isinstance(nums, list) or len(nums) != 6:
            continue
        mid = f"model_{model_name}"
        if mid not in model_ids:
            model_ids.append(mid)
            nodes.append({"id": mid, "label": model_name})
        hot_hits = sum(1 for n in nums if n in hot_set)
        cold_hits = 6 - hot_hits
        for side, val in ((left_hot, hot_hits), (left_cold, cold_hits)):
            if val <= 0:
                continue
            key = (side, mid)
            if key not in link_index:
                link_index[key] = len(links)
                links.append({"source": side, "target": mid, "value": 0, "model": model_name})
            links[link_index[key]]["value"] += val

    return {"game_type": game_type, "nodes": nodes, "links": links}
