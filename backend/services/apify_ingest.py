"""
Read Apify Actor dataset items and normalize them into result rows.
Apify is a scraper source: Jev (jev/sync.py) validates the rows, checks them against
the Sheet and the database, and decides what to publish.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from config import Config

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


def start_apify_actor_run(
    default_game_type: Optional[str] = None,
    api_token: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> Optional[str]:
    """
    Start the configured Apify Actor and wait for it to finish. Returns the run id, or None
    if APIFY_API_TOKEN / APIFY_ACTOR_ID are not set. Run this in the background only.
    """
    token = api_token or Config.APIFY_API_TOKEN
    aid = (actor_id or Config.APIFY_ACTOR_ID or "").strip()
    if not token or not aid:
        return None

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
    return str(rid)


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


def collect_apify_rows(
    run_id: str,
    default_game_type: Optional[str] = None,
    api_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch and normalize an Apify run's dataset, grouped by game. Writes nothing:
    Jev validates these rows and decides what to publish (see jev/trust.py).
    """
    token = api_token or Config.APIFY_API_TOKEN
    if not token:
        raise ValueError("APIFY_API_TOKEN is not configured")

    items = fetch_apify_dataset_items(token, run_id)
    logger.info("Apify run %s: %s dataset items", run_id, len(items))

    rows_by_game: Dict[str, List[Dict[str, Any]]] = {g: [] for g in Config.GAMES}
    skipped = 0
    for raw in items:
        normalized = normalize_apify_item(raw, default_game_type)
        if not normalized:
            skipped += 1
            continue
        game_type, result = normalized
        rows_by_game[game_type].append(result)

    return {"run_id": run_id, "items_received": len(items), "skipped_unparsed": skipped, "rows_by_game": rows_by_game}
