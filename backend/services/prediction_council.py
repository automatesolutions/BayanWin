"""
Multi-step LLM council: programmatic overlap + agent JSON round + chairman summary.
Advisory only — does not retrain ML models.
"""
from __future__ import annotations

import json
import logging
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple

from config import Config
from services.instantdb_client import instantdb
from utils.frequency_analysis import get_cold_numbers, get_hot_numbers
from utils.llm_client import LLMClient

logger = logging.getLogger(__name__)

AGENT_MODELS = [
    "XGBoost",
    "DecisionTree",
    "MarkovChain",
    "AnomalyDetection",
    "NashHotFilter",
    "DRL",
]


def _numbers_from_prediction_entry(entry: Any) -> Optional[List[int]]:
    if isinstance(entry, dict):
        if "error" in entry:
            return None
        nums = entry.get("numbers")
        if isinstance(nums, list) and len(nums) == 6:
            return [int(x) for x in nums]
    return None


def compute_overlap(predictions: Dict[str, Any]) -> Dict[str, Any]:
    sets: List[Tuple[str, List[int]]] = []
    for name in AGENT_MODELS:
        e = predictions.get(name)
        nums = _numbers_from_prediction_entry(e)
        if nums:
            sets.append((name, nums))
    if not sets:
        return {"pairs_agree": [], "vote_histogram": {}, "unique_models": 0}

    vote_counter: Counter = Counter()
    for _, nums in sets:
        for n in nums:
            vote_counter[n] += 1

    pair_scores: List[Dict[str, Any]] = []
    for i, (n1, s1) in enumerate(sets):
        for n2, s2 in sets[i + 1 :]:
            a, b = set(s1), set(s2)
            inter = len(a & b)
            union = len(a | b) or 1
            pair_scores.append(
                {
                    "model_a": n1,
                    "model_b": n2,
                    "jaccard": round(inter / union, 4),
                    "intersection_size": inter,
                }
            )

    return {
        "unique_models": len(sets),
        "vote_histogram": dict(vote_counter.most_common(20)),
        "pairs_agree": sorted(pair_scores, key=lambda x: -x["jaccard"])[:10],
    }


def historical_model_stats(game_type: str) -> Dict[str, Any]:
    """Aggregate recent accuracy by model_type (lower error_distance is better)."""
    try:
        accuracy = instantdb.get_prediction_accuracy(game_type)
    except Exception as e:
        logger.warning("accuracy fetch failed: %s", e)
        return {"by_model": {}, "note": str(e)}

    preds = instantdb.get_predictions(game_type, limit=1000)
    pred_model = {str(p.get("id")): p.get("model_type") for p in preds}

    by_model: Dict[str, List[float]] = defaultdict(list)
    for rec in accuracy:
        pid = str(rec.get("prediction_id", ""))
        mt = pred_model.get(pid)
        if not mt:
            continue
        ed = rec.get("error_distance")
        if ed is not None:
            try:
                by_model[mt].append(float(ed))
            except (TypeError, ValueError):
                pass

    summary = {}
    for mt, vals in by_model.items():
        if vals:
            summary[mt] = {
                "count": len(vals),
                "avg_error_distance": round(sum(vals) / len(vals), 4),
            }

    ranked = sorted(summary.items(), key=lambda x: x[1]["avg_error_distance"])[:6]
    return {
        "by_model": summary,
        "best_historical_models": [r[0] for r in ranked],
    }


def stats_snapshot(game_type: str) -> Dict[str, Any]:
    hot = get_hot_numbers(game_type, top_n=10)
    cold = get_cold_numbers(game_type, bottom_n=10)
    return {
        "hot_numbers": [{"number": n, "count": c} for n, c in hot],
        "cold_numbers": [{"number": n, "count": c} for n, c in cold],
    }


def run_council_report(
    game_type: str,
    predictions: Dict[str, Any],
    memory_context: str = "",
) -> Dict[str, Any]:
    if not Config.LLM_API_KEY:
        raise ValueError("LLM_API_KEY is not configured")

    overlap = compute_overlap(predictions)
    hist = historical_model_stats(game_type)
    snap = stats_snapshot(game_type)

    llm = LLMClient()

    agent_payload = {
        "game": Config.GAMES.get(game_type, {}),
        "game_type": game_type,
        "overlap": overlap,
        "historical": hist,
        "stats_snapshot": snap,
        "predictions_numeric": {
            k: v.get("numbers")
            for k, v in predictions.items()
            if k in AGENT_MODELS and isinstance(v, dict) and "numbers" in v
        },
    }

    agent_system = (
        "You are six specialist analysts (XGBoost, DecisionTree, MarkovChain, "
        "AnomalyDetection, NashHotFilter, DRL). Each speaks ONLY for their model name. "
        "Output a single JSON object with key 'agents': array of exactly 6 objects, "
        "order matching: XGBoost, DecisionTree, MarkovChain, AnomalyDetection, NashHotFilter, DRL. "
        "Each object: {\"model\": string, \"rationale_points\": string[] max 3, "
        "\"confidence\": number 0-1}. No lottery-winning claims; be factual about overlap and stats."
    )
    agent_user = json.dumps(agent_payload, default=str)

    agents_json = llm.chat_json(
        [{"role": "system", "content": agent_system}, {"role": "user", "content": agent_user}],
        temperature=0.35,
        max_tokens=1200,
    )
    agents_list = agents_json.get("agents")
    if not isinstance(agents_list, list):
        agents_list = []

    chair_system = (
        "You produce advisory summaries for a lottery analytics app. "
        "Lottery draws are random; never claim improved odds. "
        "Output JSON with keys: agreement (string), outliers (string), "
        "historical_leader_models (string), caveats (string), ensemble_narrative (string)."
    )
    chair_user = json.dumps(
        {
            "overlap": overlap,
            "historical": hist,
            "agent_opinions": agents_list,
            "user_context_memory": memory_context or "",
            "instructions": "Merge into clear sections for non-experts. Respect user_context_memory if non-empty.",
        },
        default=str,
    )

    final_json = llm.chat_json(
        [{"role": "system", "content": chair_system}, {"role": "user", "content": chair_user}],
        temperature=0.4,
        max_tokens=1500,
    )

    return {
        "game_type": game_type,
        "overlap": overlap,
        "historical": hist,
        "stats_snapshot": snap,
        "agents": agents_list,
        "summary": final_json,
    }


def load_latest_predictions_for_council(game_type: str, limit: int = 20) -> Dict[str, Any]:
    """Build predictions map keyed by model_type from latest DB rows (one per model)."""
    rows = instantdb.get_predictions(game_type, limit=limit)
    out: Dict[str, Any] = {}
    for p in rows:
        mt = p.get("model_type")
        if not mt or mt in out:
            continue
        nums = [
            p.get("predicted_number_1"),
            p.get("predicted_number_2"),
            p.get("predicted_number_3"),
            p.get("predicted_number_4"),
            p.get("predicted_number_5"),
            p.get("predicted_number_6"),
        ]
        if all(isinstance(x, (int, float)) for x in nums):
            out[mt] = {
                "numbers": [int(x) for x in nums],
                "prediction_id": p.get("id"),
            }
    return out
