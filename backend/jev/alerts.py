"""
Alerts go to Cloud Logging at ERROR severity with jsonPayload.jev="alert".
A log-based alert policy on that filter emails you (see docs/jev/README.md).
The same alert is not repeated within an hour for the same key.
"""
from __future__ import annotations

import threading
import time
from collections import deque
from typing import Any, Dict, List

from jev.decisions import _emit

REPEAT_AFTER_SECONDS = 3600
_last_sent: Dict[str, float] = {}
_recent: deque = deque(maxlen=200)
_lock = threading.Lock()


def alert(kind: str, game: str, detail: str, key: str = "", **extra: Any) -> bool:
    """kind: invalid_row | conflict | missing_result | sync_failing | quota | held. Returns False if suppressed."""
    dedupe = f"{kind}|{game}|{key or detail}"
    now = time.time()
    with _lock:
        if now - _last_sent.get(dedupe, 0) < REPEAT_AFTER_SECONDS:
            return False
        _last_sent[dedupe] = now
        entry = {"jev": "alert", "severity": "ERROR", "ts": now, "kind": kind, "game": game,
                 "message": detail, **extra}
        _recent.append(entry)
    _emit(entry)
    return True


def recent(limit: int = 50) -> List[Dict[str, Any]]:
    with _lock:
        return list(_recent)[-limit:][::-1]


def reset() -> None:
    with _lock:
        _last_sent.clear()
        _recent.clear()
