"""Load and check jev.toml. A bad config stops the backend at startup instead of failing at draw time."""
from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

CONFIG_PATH = Path(os.getenv("JEV_CONFIG_PATH") or Path(__file__).with_name("jev.toml"))

HANDLER_KINDS = ("code", "llm", "ml", "cached", "pending")


class JevConfigError(ValueError):
    pass


@dataclass(frozen=True)
class Route:
    task: str
    chain: Tuple[str, ...]  # handler first, then fallbacks
    timeout_seconds: float
    cost_cap_usd_per_day: Optional[float] = None
    cache: Optional[str] = None  # "per_draw" or None
    background: bool = False


@dataclass(frozen=True)
class JevConfig:
    timezone: str
    draw_hour: int
    draw_days: Dict[str, Tuple[int, ...]]
    no_draw_dates: frozenset
    sync: Dict[str, Any]
    validate: Dict[str, Any]
    trust: Dict[str, Any]
    cache: Dict[str, Any]
    models: Dict[str, Any]
    routes: Dict[str, Route] = field(default_factory=dict)

    def route(self, task: str) -> Route:
        if task not in self.routes:
            raise JevConfigError(f"No route for task '{task}' in jev.toml")
        return self.routes[task]


def _require(section: Dict[str, Any], keys: List[str], name: str) -> None:
    missing = [k for k in keys if k not in section]
    if missing:
        raise JevConfigError(f"jev.toml [{name}] is missing: {', '.join(missing)}")


def _check_handler(task: str, handler: str) -> None:
    kind = handler.split(":", 1)[0]
    if kind not in HANDLER_KINDS:
        raise JevConfigError(f"Route '{task}': unknown handler '{handler}'")
    if kind in ("code", "ml") and ":" not in handler:
        raise JevConfigError(f"Route '{task}': '{handler}' needs a name, e.g. {kind}:vote")
    if kind == "llm" and handler not in ("llm:large", "llm:small"):
        raise JevConfigError(f"Route '{task}': use llm:large or llm:small, not '{handler}'")


def parse(raw: Dict[str, Any], games: Optional[List[str]] = None) -> JevConfig:
    for name in ("draws", "sync", "validate", "trust", "cache", "models", "routes"):
        if name not in raw:
            raise JevConfigError(f"jev.toml is missing the [{name}] section")

    draws = raw["draws"]
    _require(draws, ["hour"], "draws")
    draw_days: Dict[str, Tuple[int, ...]] = {}
    for game, days in draws.items():
        if game in ("hour", "no_draw_dates"):
            continue
        if not isinstance(days, list) or not days or any(not isinstance(d, int) or not 0 <= d <= 6 for d in days):
            raise JevConfigError(f"jev.toml [draws] {game}: use weekdays 0 (Mon) to 6 (Sun)")
        draw_days[game] = tuple(sorted(days))
    for game in games or []:
        if game not in draw_days:
            raise JevConfigError(f"jev.toml [draws] has no draw days for {game}")
    try:
        no_draw = frozenset(date.fromisoformat(d) for d in draws.get("no_draw_dates", []))
    except ValueError as e:
        raise JevConfigError(f"jev.toml [draws] no_draw_dates: {e}") from e

    _require(raw["sync"], [
        "window_minutes_after_draw", "window_poll_seconds", "idle_poll_minutes", "tail_rows",
        "sheet_timeout_seconds", "retry_backoff_seconds", "missing_result_alert_minutes", "failed_sync_alert_after",
    ], "sync")
    _require(raw["validate"], ["hold_off_schedule_dates", "max_backfill_days"], "validate")
    _require(raw["trust"], ["scraper_can_publish"], "trust")
    _require(raw["cache"], [
        "latest_count", "fresh_seconds_in_window", "fresh_seconds_idle",
        "stream_check_seconds_in_window", "stream_check_seconds_idle",
    ], "cache")
    _require(raw["models"], ["large_env", "small_env"], "models")

    routes: Dict[str, Route] = {}
    for task, r in raw["routes"].items():
        _require(r, ["handler", "timeout_seconds"], f"routes.{task}")
        chain = (r["handler"], *r.get("fallback", []))
        for h in chain:
            _check_handler(task, h)
        if r.get("cache") not in (None, "per_draw"):
            raise JevConfigError(f"Route '{task}': cache must be \"per_draw\" or left out")
        routes[task] = Route(
            task=task,
            chain=tuple(chain),
            timeout_seconds=float(r["timeout_seconds"]),
            cost_cap_usd_per_day=r.get("cost_cap_usd_per_day"),
            cache=r.get("cache"),
            background=bool(r.get("background", False)),
        )

    return JevConfig(
        timezone=raw.get("timezone", "Asia/Manila"),
        draw_hour=int(draws["hour"]),
        draw_days=draw_days,
        no_draw_dates=no_draw,
        sync=raw["sync"],
        validate=raw["validate"],
        trust=raw["trust"],
        cache=raw["cache"],
        models=raw["models"],
        routes=routes,
    )


_loaded: Optional[JevConfig] = None


def load(path: Path = CONFIG_PATH, games: Optional[List[str]] = None) -> JevConfig:
    with open(path, "rb") as f:
        return parse(tomllib.load(f), games)


def get() -> JevConfig:
    """The process-wide config, loaded once."""
    global _loaded
    if _loaded is None:
        from config import Config

        _loaded = load(games=list(Config.GAMES))
    return _loaded
