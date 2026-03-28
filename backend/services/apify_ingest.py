"""
Ingest Apify Actor dataset items into InstantDB lottery results.
Apify-only dedupe: same composite key as Sheets path (date_key|draw_number).
Does not import or modify GoogleSheetsScraper.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from config import Config
from services.instantdb_client import instantdb

logger = logging.getLogger(__name__)


def _parse_date(date_str: Any) -> Optional[datetime]:
    if date_str is None or date_str == "":
        return None
    s = str(date_str).strip()
    if not s:
        return None
    if len(s) >= 10 and s[4] == "-":
        try:
            return datetime.strptime(s[:10], "%Y-%m-%d")
        except ValueError:
            pass
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_numbers_from_item(item: Dict[str, Any]) -> Optional[List[int]]:
    if "numbers" in item and isinstance(item["numbers"], list):
        nums = item["numbers"]
        if len(nums) == 6 and all(isinstance(x, (int, float)) for x in nums):
            return sorted(int(x) for x in nums)
    for k in ("combination", "combinations", "winning_numbers", "draw"):
        if k in item and item[k]:
            s = str(item[k]).strip()
            parts = re.split(r"[\s,\-]+", s)
            parts = [p for p in parts if p.isdigit()]
            if len(parts) == 6:
                return sorted(int(p) for p in parts)
    nums = [item.get(f"number_{i}") for i in range(1, 7)]
    if all(x is not None and str(x).strip().isdigit() for x in nums):
        return sorted(int(x) for x in nums)
    return None


def _resolve_game_type(item: Dict[str, Any], default_game: Optional[str]) -> Optional[str]:
    g = item.get("game_type") or item.get("gameType") or item.get("game")
    if isinstance(g, str) and g in Config.GAMES:
        return g
    if default_game and default_game in Config.GAMES:
        return default_game
    return None


def _parse_jackpot(val: Any) -> Optional[float]:
    if val is None or val == "":
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = re.sub(r"[,\sPHP₱]", "", str(val))
    try:
        return float(s)
    except ValueError:
        return None


def _parse_winners(val: Any) -> int:
    if val is None or val == "":
        return 0
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0


def normalize_apify_item(
    raw: Dict[str, Any],
    default_game_type: Optional[str] = None,
) -> Optional[Tuple[str, Dict[str, Any]]]:
    """
    Map one Apify dataset item to (game_type, result_dict) for create_result / save_results batch.
    Returns None if invalid.
    """
    game_type = _resolve_game_type(raw, default_game_type)
    if not game_type:
        logger.debug("Skipping item: no game_type: %s", raw)
        return None

    numbers = _parse_numbers_from_item(raw)
    if not numbers:
        logger.debug("Skipping item: no numbers: %s", raw)
        return None

    gconf = Config.GAMES[game_type]
    if any(n < gconf["min_number"] or n > gconf["max_number"] for n in numbers):
        logger.warning("Numbers out of range for %s: %s", game_type, numbers)
        return None

    draw_date = _parse_date(raw.get("draw_date") or raw.get("date") or raw.get("drawDate"))
    if not draw_date:
        logger.debug("Skipping item: no draw_date: %s", raw)
        return None

    draw_number = raw.get("draw_number") or raw.get("drawNumber") or raw.get("draw_id")
    if draw_number is not None:
        draw_number = str(draw_number).strip()
    else:
        draw_number = "-".join(f"{n:02d}" for n in numbers)

    jackpot = _parse_jackpot(raw.get("jackpot") or raw.get("jackpot_prize") or raw.get("prize"))
    winners = _parse_winners(raw.get("winners") or raw.get("winner_count"))

    result = {
        "draw_date": draw_date.date().isoformat(),
        "draw_number": draw_number,
        "number_1": numbers[0],
        "number_2": numbers[1],
        "number_3": numbers[2],
        "number_4": numbers[3],
        "number_5": numbers[4],
        "number_6": numbers[5],
        "jackpot": jackpot,
        "winners": winners,
    }
    return game_type, result


def _build_existing_lookup(game_type: str) -> Dict[str, Any]:
    lookup = {}
    try:
        existing = instantdb.get_results(game_type, limit=10000)
    except Exception as e:
        logger.warning("Could not load existing results for %s: %s", game_type, e)
        return lookup

    for result in existing:
        draw_date = result.get("draw_date")
        draw_number = result.get("draw_number") or ""
        if not draw_date:
            continue
        if isinstance(draw_date, str):
            try:
                dt = datetime.fromisoformat(draw_date.replace("Z", "+00:00"))
                date_key = dt.date().isoformat()
            except ValueError:
                date_key = draw_date.split("T")[0] if "T" in draw_date else draw_date
        else:
            date_key = str(draw_date)
        lookup[f"{date_key}|{draw_number}"] = result
    return lookup


def auto_ingest_from_apify_actor(
    default_game_type: Optional[str] = None,
    api_token: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Start the configured Apify Actor, wait for completion, ingest dataset into InstantDB.
    Run input: { "game_type": "<id>" } when default_game_type is set; {} otherwise.
    Skips gracefully if token or actor_id missing.
    """
    token = api_token or Config.APIFY_API_TOKEN
    aid = (actor_id or Config.APIFY_ACTOR_ID or "").strip()
    if not token or not aid:
        return {
            "skipped": True,
            "reason": "APIFY_API_TOKEN or APIFY_ACTOR_ID not set",
            "total_added": 0,
        }

    from apify_client import ApifyClient

    client = ApifyClient(token)
    run_input: Dict[str, Any] = {}
    if default_game_type and default_game_type in Config.GAMES:
        run_input["game_type"] = default_game_type

    logger.info("Starting Apify actor %s with input %s", aid, run_input)
    call_result = client.actor(aid).call(run_input=run_input)
    if not call_result:
        raise ValueError("Apify actor call returned no result")

    rid = call_result.get("id") if isinstance(call_result, dict) else getattr(call_result, "id", None)
    if not rid:
        raise ValueError("Apify run id missing from actor response")

    return ingest_apify_run(str(rid), default_game_type=default_game_type, api_token=token)


def fetch_apify_dataset_items(api_token: str, run_id: str) -> List[Dict[str, Any]]:
    from apify_client import ApifyClient

    client = ApifyClient(api_token)
    run = client.run(run_id).get()
    if not run:
        raise ValueError(f"Apify run not found: {run_id}")
    dataset_id = run.get("defaultDatasetId")
    if not dataset_id:
        raise ValueError("Run has no defaultDatasetId — check run status and Actor output")

    out: List[Dict[str, Any]] = []
    for item in client.dataset(dataset_id).iterate_items():
        if isinstance(item, dict):
            out.append(item)
    return out


def ingest_apify_run(
    run_id: str,
    default_game_type: Optional[str] = None,
    api_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch Apify dataset items, normalize, dedupe per game, write via InstantDB bridge.
    """
    token = api_token or Config.APIFY_API_TOKEN
    if not token:
        raise ValueError("APIFY_API_TOKEN is not configured")

    items = fetch_apify_dataset_items(token, run_id)
    logger.info("Apify run %s: %s dataset items", run_id, len(items))

    per_game_new: Dict[str, List[Dict[str, Any]]] = {g: [] for g in Config.GAMES}
    skipped = 0

    lookups = {g: _build_existing_lookup(g) for g in Config.GAMES}

    for raw in items:
        normalized = normalize_apify_item(raw, default_game_type)
        if not normalized:
            skipped += 1
            continue
        game_type, result = normalized
        dt_key = result["draw_date"]
        dnum = result.get("draw_number", "")
        composite = f"{dt_key}|{dnum}"
        if composite in lookups[game_type]:
            continue
        lookups[game_type][composite] = True
        per_game_new[game_type].append(result)

    added_by_game = {}
    total_added = 0
    errors = []

    for game_type, results in per_game_new.items():
        added_by_game[game_type] = 0
        if not results:
            continue
        for row in results:
            try:
                instantdb.create_result(game_type, row)
                added_by_game[game_type] += 1
                total_added += 1
            except Exception as e:
                logger.exception("Failed saving Apify row for %s", game_type)
                errors.append(f"{game_type} {row.get('draw_date')}: {e}")

    return {
        "success": len(errors) == 0,
        "run_id": run_id,
        "items_received": len(items),
        "skipped_unparsed": skipped,
        "total_added": total_added,
        "added_by_game": added_by_game,
        "errors": errors,
    }
