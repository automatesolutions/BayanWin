"""Tiny monotonic-clock TTL cache for expensive API computations."""
from __future__ import annotations

import time
from typing import Any, Callable, Dict, Hashable, Tuple, TypeVar

T = TypeVar("T")
Entry = Tuple[float, Any]


def get_or_set(
    store: Dict[Hashable, Entry],
    ttl_sec: float,
    key: Hashable,
    factory: Callable[[], T],
) -> T:
    now = time.monotonic()
    hit = store.get(key)
    if hit is not None:
        ts, val = hit
        if now - ts < ttl_sec:
            return val  # type: ignore[return-value]
    val = factory()
    store[key] = (now, val)
    return val
