"""End-to-end Jev sync with a fake Sheet and a fake database."""
import asyncio
from datetime import date, datetime
from zoneinfo import ZoneInfo

from jev import alerts, decisions
from jev.cache import ResultsCache
from jev.jobs import JobQueue
from jev.router import Router
from jev.sheet import SheetError, tail_with_row_numbers, trim_rows
from jev.store import numbers_of
from jev.sync import Jev
from tests.conftest import GAMES

M = ZoneInfo("Asia/Manila")
HEADER = ["LOTTO GAME", "COMBINATIONS", "DRAW DATE", "JACKPOT (PHP)", "WINNERS"]
G = "ultra_lotto_6_58"


class FakeReader:
    def __init__(self, rows, fail_times=0, status=429):
        self.rows, self.fail_times, self.status, self.calls = rows, fail_times, status, 0

    def read_tail(self, sheet_id, tail):
        self.calls += 1
        if self.calls <= self.fail_times:
            raise SheetError("quota", self.status)
        header, rows = tail_with_row_numbers([HEADER] + self.rows, tail)
        return header, rows, 1.0


class FakeStore:
    def __init__(self, existing=()):
        self.rows = [dict(r, id=f"old{i}") for i, r in enumerate(existing)]
        self.inserts = []

    def results_on_dates(self, game, dates_iso):
        return [r for r in self.rows if r["draw_date"] in set(dates_iso)]

    def insert_result(self, game, row):
        rid = f"new{len(self.inserts)}"
        self.inserts.append(row)
        self.rows.append(dict(row, id=rid))
        return rid

    def latest_results(self, game, limit):
        return sorted(self.rows, key=lambda r: r["draw_date"], reverse=True)[:limit]


def db_row(day, nums):
    return {"draw_date": f"{day}T00:00:00", **{f"number_{i + 1}": n for i, n in enumerate(nums)}}


def make(cfg, reader, store, now=datetime(2026, 10, 27, 21, 40, tzinfo=M), post=None):
    cache = ResultsCache(store.latest_results, 10, lambda g: 30.0)

    async def no_sleep(_):
        return None
    jev = Jev(cfg, GAMES, {G: "sheet-id"}, reader, store, cache, Router(cfg, env={}), JobQueue(),
              post_publish=post, now=lambda: now, sleep=no_sleep)
    return jev


def sheet(day, combo, game="Ultra Lotto 6/58"):
    return [game, combo, day, "430,857,884.28", "0"]


def test_trim_rows_handles_gspread_empty_range():
    # The bug: gspread 6 returns [[]] for an empty range, which the old code counted as a row.
    assert trim_rows([[]]) == []
    assert trim_rows([["a"], [], [""]]) == [["a"]]
    header, rows = tail_with_row_numbers([HEADER, sheet("10/25/2026", "1-2-3-4-5-6"), [], []], 40)
    assert header == HEADER and rows[0][0] == 2


def test_new_valid_row_publishes_then_queues_analysis(cfg):
    ran = []
    store = FakeStore([db_row("2026-10-25", (1, 2, 3, 4, 5, 6))])
    reader = FakeReader([sheet("10/25/2026", "01-02-03-04-05-06"), sheet("10/27/2026", "14-38-44-25-52-47")])
    jev = make(cfg, reader, store, post=lambda g: ran.append(g))

    async def go():
        out = await jev.sync_game(G, "test", edited_at=datetime(2026, 10, 27, 21, 39, 50, tzinfo=M))
        await jev.jobs.drain()
        return out
    out = asyncio.run(go())

    assert [p["draw_date"] for p in out["published"]] == ["2026-10-27"]
    assert len(store.inserts) == 1 and numbers_of(store.inserts[0]) == (14, 25, 38, 44, 47, 52)
    assert ran == [G]  # background analysis ran once, after publishing
    lat = jev.publish_latency_s[-1]
    assert lat["edit_to_publish_s"] == 10.0 and lat["draw_to_publish_s"] == 2400.0
    assert jev.cache.local_bumps == 1  # open pages are woken


def test_same_draw_twice_publishes_once_and_analyzes_once(cfg):
    ran = []
    store = FakeStore()
    reader = FakeReader([sheet("10/27/2026", "14-38-44-25-52-47")])
    jev = make(cfg, reader, store, post=lambda g: ran.append(g))

    async def go():
        await jev.sync_game(G, "a")
        await jev.sync_game(G, "b")
        await jev.jobs.drain()
    asyncio.run(go())
    assert len(store.inserts) == 1 and ran == [G]


def test_invalid_row_is_held_and_alerted_never_written(cfg):
    store = FakeStore()
    jev = make(cfg, FakeReader([sheet("10/27/2026", "14-38-44-25-52-99")]), store)
    out = asyncio.run(jev.sync_game(G, "t"))
    assert out["rejected"] == 1 and store.inserts == []
    assert alerts.recent(1)[0]["kind"] == "invalid_row"


def test_correction_in_sheet_is_held_not_overwritten(cfg):
    store = FakeStore([db_row("2026-10-27", (1, 2, 3, 4, 5, 6))])
    jev = make(cfg, FakeReader([sheet("10/27/2026", "01-02-03-04-05-07")]), store)
    out = asyncio.run(jev.sync_game(G, "t"))
    assert store.inserts == [] and out["held"][0]["reason"] == "sheet_differs_from_published"
    assert alerts.recent(1)[0]["kind"] == "conflict"


def test_old_row_new_to_database_is_held(cfg):
    jev = make(cfg, FakeReader([sheet("01/02/2026", "01-02-03-04-05-06")]), FakeStore())  # Fri, > 30 days ago
    out = asyncio.run(jev.sync_game(G, "t"))
    assert out["held"][0]["reason"] == "too_old_to_backfill"


def test_sheet_quota_retries_with_backoff_then_succeeds(cfg):
    reader = FakeReader([sheet("10/27/2026", "14-38-44-25-52-47")], fail_times=2)
    jev = make(cfg, reader, FakeStore())
    out = asyncio.run(jev.sync_game(G, "t"))
    assert out["ok"] and reader.calls == 3 and jev.counters["sheet_quota_errors"] == 2


def test_sheet_down_keeps_last_good_data_and_alerts(cfg):
    store = FakeStore([db_row("2026-10-25", (1, 2, 3, 4, 5, 6))])
    reader = FakeReader([], fail_times=99, status=503)
    jev = make(cfg, reader, store)
    rows, _ = jev.cache.latest(G, 5)  # warm the cache
    for _ in range(cfg.sync["failed_sync_alert_after"]):
        out = asyncio.run(jev.sync_game(G, "t"))
    assert out["ok"] is False and jev.failures[G] == cfg.sync["failed_sync_alert_after"]
    assert alerts.recent(1)[0]["kind"] == "sync_failing"
    assert jev.cache.latest(G, 5)[0] == rows  # still serving the last good data


def test_scraper_rows_wait_for_the_sheet(cfg):
    store = FakeStore()
    jev = make(cfg, FakeReader([]), store)
    out = asyncio.run(jev.ingest_scraper_rows(G, [db_row("2026-10-27", (14, 25, 38, 44, 47, 52))], source="apify"))
    assert store.inserts == [] and out["held"][0]["reason"] == "waiting_for_sheet"


def test_tick_syncs_due_games_and_flags_overdue(cfg):
    store = FakeStore([db_row("2026-10-25", (1, 2, 3, 4, 5, 6))])
    now = datetime(2026, 10, 27, 23, 30, tzinfo=M)  # 150 min after Tuesday's draw, nothing in the Sheet
    jev = make(cfg, FakeReader([sheet("10/25/2026", "01-02-03-04-05-06")]), store, now=now)
    report = asyncio.run(jev.tick())
    assert report[G]["due"] and report[G]["sync"]["ok"]
    assert report[G]["overdue"] == "2026-10-27"
    assert alerts.recent(1)[0]["kind"] == "missing_result"
    # The next tick a few seconds later is not due, and the alert is not repeated.
    report2 = asyncio.run(jev.tick())
    assert not report2[G]["due"] and len([a for a in alerts.recent() if a["kind"] == "missing_result"]) == 1


def test_cache_serves_fresh_data_without_reloading(cfg):
    calls = []
    store = FakeStore([db_row("2026-10-25", (1, 2, 3, 4, 5, 6))])

    def loader(g, n):
        calls.append(n)
        return store.latest_results(g, n)
    cache = ResultsCache(loader, 10, lambda g: 30.0)
    cache.latest(G, 5)
    cache.latest(G, 5)
    assert len(calls) == 1 and cache.stats()["hits"] == 1
    cache.invalidate(G)
    cache.latest(G, 5)
    assert len(calls) == 2


def test_every_publish_is_logged(cfg):
    jev = make(cfg, FakeReader([sheet("10/27/2026", "14-38-44-25-52-47")]), FakeStore())
    asyncio.run(jev.sync_game(G, "t"))
    kinds = [d["kind"] for d in decisions.recent(10)]
    assert "publish" in kinds and "sync" in kinds
