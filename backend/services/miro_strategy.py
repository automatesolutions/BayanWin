"""
Miro strategy: two-round LLM workflow (six specialist voices + chairman) over rich analytics context.
Produces six lottery numbers; advisory only — does not retrain base ML models.
Fallback: frequency vote across base model picks if LLM output is invalid.
"""
from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

from config import Config
from services.prediction_council import compute_overlap, historical_model_stats, stats_snapshot
from utils.frequency_analysis import get_overdue_numbers
from utils.gaussian_summary import gaussian_distribution_bands
from utils.graph_aggregates import cooccurrence_edges, markov_ball_transitions
from utils.llm_client import LLMClient

logger = logging.getLogger(__name__)

COOCCURRENCE_EDGE_CAP = 45
MARKOV_EDGE_CAP = 45
OVERDUE_CAP = 15
BASE_MODEL_ORDER = [
    "XGBoost",
    "DecisionTree",
    "MarkovChain",
    "AnomalyDetection",
    "NashHotFilter",
    "DRL",
]


def build_miro_context(game_type: str, predictions: Dict[str, Any]) -> Dict[str, Any]:
    """Bounded JSON-serializable context for LLM rounds (graphs, stats, overlaps, base picks)."""
    game_cfg = Config.GAMES.get(game_type, {})
    co = cooccurrence_edges(game_type, limit_draws=2000)
    mk = markov_ball_transitions(game_type, limit_draws=2000)
    co_edges = (co.get("edges") or [])[:COOCCURRENCE_EDGE_CAP]
    mk_edges = (mk.get("edges") or [])[:MARKOV_EDGE_CAP]

    overdue = get_overdue_numbers(game_type)[:OVERDUE_CAP]
    gaussian_bands = gaussian_distribution_bands(game_type)

    preds_numeric = {
        k: v.get("numbers")
        for k, v in predictions.items()
        if isinstance(v, dict) and "error" not in v and isinstance(v.get("numbers"), list)
    }

    base_predictions_only = {k: v for k, v in preds_numeric.items() if k in BASE_MODEL_ORDER}

    return {
        "game_type": game_type,
        "game_rules": {
            "name": game_cfg.get("name"),
            "min_number": game_cfg.get("min_number"),
            "max_number": game_cfg.get("max_number"),
            "numbers_count": game_cfg.get("numbers_count", 6),
        },
        "base_predictions": base_predictions_only,
        "overlap_between_models": compute_overlap(predictions),
        "historical_error_by_model": historical_model_stats(game_type),
        "stats_hot_cold": stats_snapshot(game_type),
        "overdue_numbers": [{"number": n, "days_since": d} for n, d in overdue],
        "gaussian_sum_band": gaussian_bands.get("sum") if gaussian_bands else None,
        "gaussian_product_band": gaussian_bands.get("product") if gaussian_bands else None,
        "cooccurrence_top_edges": co_edges,
        "cooccurrence_meta": {"draws_used": co.get("draws_used")},
        "markov_top_edges": mk_edges,
        "markov_meta": {"transition_pairs": mk.get("transition_pairs")},
    }


def _game_bounds(game_type: str) -> Tuple[int, int]:
    g = Config.GAMES[game_type]
    return int(g["min_number"]), int(g["max_number"])


def _validate_numbers(nums: Any, lo: int, hi: int, need: int = 6) -> Optional[List[int]]:
    if not isinstance(nums, list) or len(nums) != need:
        return None
    out: List[int] = []
    seen = set()
    for x in nums:
        try:
            v = int(x)
        except (TypeError, ValueError):
            return None
        if v < lo or v > hi or v in seen:
            return None
        seen.add(v)
        out.append(v)
    return out


def deterministic_fallback_votes(predictions: Dict[str, Any], game_type: str) -> List[int]:
    """
    If LLM output fails: pick six numbers by vote frequency across base models, then fill gaps.
    Documented fallback so the pipeline does not break on bad JSON.
    """
    lo, hi = _game_bounds(game_type)
    counts: Counter = Counter()
    for name in BASE_MODEL_ORDER:
        p = predictions.get(name)
        if not isinstance(p, dict) or "error" in p:
            continue
        nums = p.get("numbers")
        if not isinstance(nums, list):
            continue
        for x in nums:
            try:
                v = int(x)
            except (TypeError, ValueError):
                continue
            if lo <= v <= hi:
                counts[v] += 1
    if not counts:
        return [lo, lo + 1, lo + 2, lo + 3, lo + 4, lo + 5]
    ranked = [n for n, _ in sorted(counts.items(), key=lambda t: (-t[1], t[0]))]
    chosen: List[int] = []
    for n in ranked:
        if n not in chosen:
            chosen.append(n)
        if len(chosen) >= 6:
            break
    for n in range(lo, hi + 1):
        if len(chosen) >= 6:
            break
        if n not in chosen:
            chosen.append(n)
    return sorted(chosen[:6])


def run_miro_strategy_predict(game_type: str, predictions: Dict[str, Any]) -> List[int]:
    """
    Run two LLM JSON rounds; return six distinct ints in game bounds.
    Raises ValueError if LLM_API_KEY is missing.
    """
    if not Config.LLM_API_KEY:
        raise ValueError("LLM_API_KEY is not configured")

    lo, hi = _game_bounds(game_type)
    ctx = build_miro_context(game_type, predictions)
    llm = LLMClient()

    agent_system = (
        "You simulate six specialist analysts named exactly: XGBoost, DecisionTree, MarkovChain, "
        "AnomalyDetection, NashHotFilter, DRL. They respond to SHARED data only (no live web). "
        "Lottery draws are random; never claim improved odds or guaranteed wins. "
        "Output a single JSON object with key 'agents': array of exactly 6 objects, in this order: "
        "XGBoost, DecisionTree, MarkovChain, AnomalyDetection, NashHotFilter, DRL. "
        "Each object: {\"model\": string (same name), \"reaction_to_others\": string (one short paragraph), "
        "\"preferred_numbers\": number[] (optional, up to 8 distinct ints in the game's valid range), "
        "\"concerns\": string[] (max 3 short strings)}. JSON only."
    )
    agents_json = llm.chat_json(
        [{"role": "system", "content": agent_system}, {"role": "user", "content": json.dumps(ctx, default=str)}],
        temperature=0.35,
        max_tokens=1600,
    )

    chair_system = (
        "You are the chairman synthesizing advisory lottery analytics for an app. "
        f"Output JSON with key 'final_numbers': exactly {ctx['game_rules'].get('numbers_count', 6)} "
        f"distinct integers each between {lo} and {hi} inclusive for this game. "
        "Optionally include 'rationale': one short string (no winning claims). "
        "Respect the data: model disagreement, graph edges, hot/cold/overdue, historical errors, "
        "Gaussian sum band and product band (mean/std/min/max plus log_mean/log_std on products). "
        "JSON only."
    )
    chair_user = json.dumps(
        {
            "analytics_context": ctx,
            "round1_agents": agents_json.get("agents"),
            "task": "Choose final_numbers the app will display as one merged pick; be consistent with bounds.",
        },
        default=str,
    )
    final_json = llm.chat_json(
        [{"role": "system", "content": chair_system}, {"role": "user", "content": chair_user}],
        temperature=0.25,
        max_tokens=800,
    )

    nums = _validate_numbers(final_json.get("final_numbers"), lo, hi)
    if nums is not None:
        logger.info("Miro chairman produced valid final_numbers")
        return sorted(nums)

    # One repair pass: chairman must fix
    repair_system = (
        f"The previous reply was invalid. Output ONLY JSON: {{\"final_numbers\": [..]}} with exactly 6 distinct "
        f"integers from {lo} to {hi}. No commentary outside the object."
    )
    repair_user = json.dumps({"bad_prior": final_json, "context_summary": ctx.get("base_predictions")})
    try:
        repaired = llm.chat_json(
            [{"role": "system", "content": repair_system}, {"role": "user", "content": repair_user}],
            temperature=0.1,
            max_tokens=400,
        )
        nums2 = _validate_numbers(repaired.get("final_numbers"), lo, hi)
        if nums2 is not None:
            logger.info("Miro repair pass succeeded")
            return sorted(nums2)
    except Exception as e:
        logger.warning("Miro repair LLM call failed: %s", e)

    fb = deterministic_fallback_votes(predictions, game_type)
    logger.warning("Miro using deterministic frequency fallback from base models")
    return fb
