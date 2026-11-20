"""
Latest results per game, kept in memory. Fresh = under 30 s inside a draw window, 5 minutes
otherwise (jev.toml [cache]). A publish invalidates the game at once and wakes open
streams. Other Cloud Run instances pick the change up within their own freshness time.
"""
from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple

from jev import decisions


@dataclass
class _Entry:
    rows: List[Dict[str, Any]] = field(default_factory=list)
    fetched_at: float = 0.0  # monotonic
    stale: bool = True


class ResultsCache:
    def __init__(
        self,
        loader: Callable[[str, int], List[Dict[str, Any]]],
        latest_count: int,
        fresh_seconds: Callable[[str], float],
        clock: Callable[[], float] = time.monotonic,
    ):
        self._loader = loader
        self._count = latest_count
        self._fresh = fresh_seconds
        self._clock = clock
        self._entries: Dict[str, _Entry] = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0
        self.local_bumps = 0  # increments on every local publish; streams watch it
        self.last_synced_at: Dict[str, float] = {}  # wall clock, set by sync
        self.last_published_at: Dict[str, float] = {}

    def latest(self, game: str, limit: int) -> Tuple[List[Dict[str, Any]], bool]:
        """(rows, served_from_cache). Larger pages than latest_count go straight to the loader."""
        if limit > self._count:
            self.misses += 1
            return self._loader(game, limit), False
        with self._lock:
            e = self._entries.get(game)
            fresh = e is not None and not e.stale and self._clock() - e.fetched_at < self._fresh(game)
            if fresh:
                self.hits += 1
                return e.rows[:limit], True
        t0 = time.perf_counter()
        try:
            rows = self._loader(game, self._count)
        except Exception as err:
            # Fall back to the last good data rather than failing the page.
            with self._lock:
                e = self._entries.get(game)
            if e is not None and e.rows:
                decisions.log("cache", game, "last_good", f"reload failed: {err}", "fallback", (time.perf_counter() - t0) * 1000)
                return e.rows[:limit], True
            raise
        with self._lock:
            self._entries[game] = _Entry(rows, self._clock(), False)
            self.misses += 1
        return rows[:limit], False

    def fingerprint(self, game: str) -> Optional[str]:
        rows, _ = self.latest(game, 1)
        if not rows:
            return None
        r = rows[0]
        return f"{str(r.get('draw_date'))[:10]}|{r.get('id')}"

    def invalidate(self, game: str) -> None:
        with self._lock:
            e = self._entries.setdefault(game, _Entry())
            e.stale = True
            self.local_bumps += 1
            self.last_published_at[game] = time.time()

    def mark_synced(self, game: str) -> None:
        self.last_synced_at[game] = time.time()

    def stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        return {"hits": self.hits, "misses": self.misses, "hit_rate": round(self.hits / total, 3) if total else None}
