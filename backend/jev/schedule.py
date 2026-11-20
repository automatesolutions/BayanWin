"""Draw-time awareness: when the last draw happened, how often to sync, and which draws are overdue."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Optional, Tuple
from zoneinfo import ZoneInfo

from jev.config import JevConfig


def now_local(cfg: JevConfig) -> datetime:
    return datetime.now(ZoneInfo(cfg.timezone))


def draw_at(cfg: JevConfig, day: date) -> datetime:
    return datetime.combine(day, time(cfg.draw_hour), tzinfo=ZoneInfo(cfg.timezone))


def is_draw_day(cfg: JevConfig, game: str, day: date) -> bool:
    return day.weekday() in cfg.draw_days[game] and day not in cfg.no_draw_dates


def last_draw(cfg: JevConfig, game: str, now: datetime) -> Optional[datetime]:
    """Most recent scheduled draw at or before `now` (looks back two weeks)."""
    for back in range(15):
        day = (now - timedelta(days=back)).date()
        if is_draw_day(cfg, game, day):
            at = draw_at(cfg, day)
            if at <= now:
                return at
    return None


def in_window(cfg: JevConfig, game: str, now: datetime) -> bool:
    last = last_draw(cfg, game, now)
    return last is not None and now - last <= timedelta(minutes=cfg.sync["window_minutes_after_draw"])


def sync_due(cfg: JevConfig, game: str, now: datetime, last_sync: Optional[datetime]) -> Tuple[bool, str]:
    """(due, reason). Inside the window after a draw, sync often; otherwise rarely."""
    window = in_window(cfg, game, now)
    every = timedelta(seconds=cfg.sync["window_poll_seconds"]) if window else timedelta(minutes=cfg.sync["idle_poll_minutes"])
    label = "draw_window" if window else "idle"
    if last_sync is None:
        return True, f"{label}:first_sync"
    # Small slack so a once-a-minute scheduler doesn't skip a beat on timing jitter.
    if now - last_sync >= every - timedelta(seconds=5):
        return True, f"{label}:every_{int(every.total_seconds())}s"
    return False, f"{label}:not_due"


def overdue_draw(cfg: JevConfig, game: str, now: datetime, latest_published: Optional[date]) -> Optional[date]:
    """The last draw's date if it has no result yet and the alert delay has passed, else None."""
    last = last_draw(cfg, game, now)
    if last is None:
        return None
    if latest_published is not None and latest_published >= last.date():
        return None
    if now - last < timedelta(minutes=cfg.sync["missing_result_alert_minutes"]):
        return None
    return last.date()
