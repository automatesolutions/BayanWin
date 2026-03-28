"""User preference memory: InstantDB user_memory + optional Zep graph search."""
from __future__ import annotations

import json
import logging
import os
import subprocess
from typing import Any, Dict, Optional

from config import Config

logger = logging.getLogger(__name__)


def _run_user_memory_script(payload: Dict[str, Any]) -> Dict[str, Any]:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.normpath(os.path.join(current_dir, "..", "scripts", "user_memory.js"))
    if not os.path.exists(script_path):
        raise FileNotFoundError(f"user_memory.js not found at {script_path}")

    env = os.environ.copy()
    if Config.INSTANTDB_APP_ID:
        env["INSTANTDB_APP_ID"] = str(Config.INSTANTDB_APP_ID)
    if Config.INSTANTDB_ADMIN_TOKEN:
        env["INSTANTDB_ADMIN_TOKEN"] = str(Config.INSTANTDB_ADMIN_TOKEN)

    result = subprocess.run(
        ["node", script_path],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        timeout=45,
        env=env,
        cwd=os.path.dirname(script_path) or os.getcwd(),
    )
    if result.returncode != 0:
        err = result.stderr or result.stdout
        raise RuntimeError(f"user_memory script failed: {err[:800]}")

    out = result.stdout.strip()
    if not out:
        return {}
    line = out.splitlines()[-1]
    return json.loads(line)


def get_user_memory_record(user_key: str) -> Optional[Dict[str, Any]]:
    try:
        data = _run_user_memory_script({"action": "get", "user_key": user_key})
        return data.get("record")
    except Exception as e:
        logger.warning("get_user_memory failed: %s", e)
        return None


def upsert_user_memory(
    user_key: str,
    pinned_games: Optional[str] = None,
    preferences: Optional[str] = None,
    last_summary: Optional[str] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"action": "upsert", "user_key": user_key}
    if pinned_games is not None:
        payload["pinned_games"] = pinned_games
    if preferences is not None:
        payload["preferences"] = preferences
    if last_summary is not None:
        payload["last_summary"] = last_summary
    return _run_user_memory_script(payload)


def format_instant_memory_block(record: Optional[Dict[str, Any]]) -> str:
    if not record:
        return ""
    parts = []
    if record.get("pinned_games"):
        parts.append(f"Pinned games (JSON or text): {record['pinned_games']}")
    if record.get("preferences"):
        parts.append(f"Preferences: {record['preferences']}")
    if record.get("last_summary"):
        parts.append(f"Recent summary excerpt: {record['last_summary'][:1200]}")
    return "\n".join(parts)


def zep_memory_snippet(user_key: str) -> str:
    if not Config.ZEP_API_KEY or not Config.ZEP_GRAPH_ID:
        return ""
    try:
        from zep_cloud.client import Zep

        client = Zep(api_key=Config.ZEP_API_KEY)
        kwargs = dict(
            graph_id=Config.ZEP_GRAPH_ID,
            query=f"lottery user preferences {user_key}",
            limit=5,
            scope="edges",
        )
        try:
            search_results = client.graph.search(reranker="cross_encoder", **kwargs)
        except TypeError:
            search_results = client.graph.search(**kwargs)
        facts = []
        edges = getattr(search_results, "edges", None) or []
        for e in edges[:5]:
            fact = getattr(e, "fact", None) or (e.get("fact") if isinstance(e, dict) else None)
            if fact:
                facts.append(str(fact))
        return "Zep graph facts:\n" + "\n".join(f"- {f}" for f in facts) if facts else ""
    except Exception as e:
        logger.debug("Zep memory skipped: %s", e)
        return ""


def build_memory_context_for_council(user_key: Optional[str]) -> str:
    if not user_key:
        return ""
    rec = get_user_memory_record(user_key)
    block = format_instant_memory_block(rec)
    zep = zep_memory_snippet(user_key)
    if zep:
        block = block + "\n" + zep if block else zep
    return block.strip()
