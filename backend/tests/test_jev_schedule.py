from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from jev import schedule

M = ZoneInfo("Asia/Manila")
G = "ultra_lotto_6_58"  # Tue, Fri, Sun at 9 PM


def at(y, mo, d, h, mi=0):
    return datetime(y, mo, d, h, mi, tzinfo=M)


def test_last_draw_and_window(cfg):
    tue_930 = at(2026, 10, 27, 21, 30)
    assert schedule.last_draw(cfg, G, tue_930) == at(2026, 10, 27, 21)
    assert schedule.in_window(cfg, G, tue_930)
    assert not schedule.in_window(cfg, G, at(2026, 10, 28, 10))  # Wed morning
    # Before 9 PM on a draw day, the last draw is the previous one (Sun).
    assert schedule.last_draw(cfg, G, at(2026, 10, 27, 20)) == at(2026, 10, 25, 21)


def test_sync_cadence_fast_in_window_slow_otherwise(cfg):
    in_win = at(2026, 10, 27, 21, 40)
    assert schedule.sync_due(cfg, G, in_win, in_win - timedelta(seconds=60))[0]
    assert not schedule.sync_due(cfg, G, in_win, in_win - timedelta(seconds=20))[0]
    idle = at(2026, 10, 28, 10)
    assert not schedule.sync_due(cfg, G, idle, idle - timedelta(minutes=5))[0]
    assert schedule.sync_due(cfg, G, idle, idle - timedelta(minutes=10))[0]
    assert schedule.sync_due(cfg, G, idle, None) == (True, "idle:first_sync")


def test_overdue_alert_after_delay(cfg):
    delay = cfg.sync["missing_result_alert_minutes"]
    draw = at(2026, 10, 27, 21)
    assert schedule.overdue_draw(cfg, G, draw + timedelta(minutes=delay - 1), date(2026, 10, 25)) is None
    assert schedule.overdue_draw(cfg, G, draw + timedelta(minutes=delay + 1), date(2026, 10, 25)) == date(2026, 10, 27)
    assert schedule.overdue_draw(cfg, G, draw + timedelta(minutes=delay + 1), date(2026, 10, 27)) is None


def test_no_draw_dates_are_skipped(cfg):
    # 2026-12-25 is a Friday (a 6/58 draw day) but listed as a no-draw date.
    assert not schedule.is_draw_day(cfg, G, date(2026, 12, 25))
    assert schedule.last_draw(cfg, G, at(2026, 12, 25, 23)) == at(2026, 12, 22, 21)
