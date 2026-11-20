"""
Every Jev decision is one JSON line on stdout. Cloud Run sends stdout to Cloud Logging,
which reads `severity` and indexes the other fields (filter: jsonPayload.jev="decision").
The last 2,000 decisions also stay in memory for /api/jev/summary.
"""
from __future__ import annotations

import json
import sys
import threading
import time
from collections import deque
from typing import Any, Dict, List, Optional

_buffer: deque = deque(maxlen=2000)
_lock = threading.Lock()


def _emit(payload: Dict[str, Any]) -> None:
    try:
        sys.stdout.write(json.dumps(payload, default=str, ensure_ascii=False) + "\n")
        sys.stdout.flush()
    except Exception:
        pass


def log(
    kind: str,
    task: str,
    option: str,
    reason: str,
    outcome: str,
    latency_ms: Optional[float] = None,
    cost_usd: float = 0.0,
    **extra: Any,
) -> Dict[str, Any]:
    """kind: route | sync | publish | trust | cache. outcome: ok | fallback | held | skipped | error."""
    entry = {
        "jev": "decision",
        "severity": "WARNING" if outcome in ("error", "held") else "INFO",
        "ts": time.time(),
        "kind": kind,
        "task": task,
        "option": option,
        "reason": reason,
        "outcome": outcome,
        "latency_ms": round(latency_ms, 1) if latency_ms is not None else None,
        "cost_usd": round(cost_usd, 6),
        **extra,
    }
    with _lock:
        _buffer.append(entry)
    _emit(entry)
    return entry


def recent(limit: int = 100, kind: Optional[str] = None) -> List[Dict[str, Any]]:
    with _lock:
        items = list(_buffer)
    if kind:
        items = [e for e in items if e["kind"] == kind]
    return items[-limit:][::-1]


def _pct(values: List[float], p: float) -> Optional[float]:
    if not values:
        return None
    s = sorted(values)
    return round(s[min(len(s) - 1, int(round(p * (len(s) - 1))))], 1)


def summary() -> Dict[str, Any]:
    """Per (kind, task, option): calls, outcomes, p50/p95 latency and total cost."""
    with _lock:
        items = list(_buffer)
    groups: Dict[str, Dict[str, Any]] = {}
    for e in items:
        key = f"{e['kind']}:{e['task']}:{e['option']}"
        g = groups.setdefault(key, {"kind": e["kind"], "task": e["task"], "option": e["option"],
                                    "calls": 0, "outcomes": {}, "latencies": [], "cost_usd": 0.0})
        g["calls"] += 1
        g["outcomes"][e["outcome"]] = g["outcomes"].get(e["outcome"], 0) + 1
        if e.get("latency_ms") is not None:
            g["latencies"].append(e["latency_ms"])
        g["cost_usd"] += e.get("cost_usd") or 0.0
    rows = []
    for g in groups.values():
        lat = g.pop("latencies")
        g["p50_ms"], g["p95_ms"] = _pct(lat, 0.5), _pct(lat, 0.95)
        g["cost_usd"] = round(g["cost_usd"], 4)
        rows.append(g)
    rows.sort(key=lambda r: (-(r["p95_ms"] or 0), -r["cost_usd"]))
    since = items[0]["ts"] if items else None
    return {"decisions_in_memory": len(items), "since_ts": since, "routes": rows}


def reset() -> None:
    with _lock:
        _buffer.clear()
