"""
Jev's sync engine: Sheet tail -> validate -> trust -> publish -> invalidate cache -> queue analysis.
Publishing never waits on analysis. Failures keep the last good data and raise alerts.
"""
from __future__ import annotations

import asyncio
import time
from datetime import date, datetime, timedelta
from typing import Any, Awaitable, Callable, Dict, List, Optional, Sequence

from jev import alerts, decisions, schedule, trust
from jev.cache import ResultsCache
from jev.config import JevConfig
from jev.jobs import JobQueue
from jev.router import Router
from jev.sheet import SheetError
from jev.store import numbers_of
from jev.validate import Candidate, Rejected, column_map, validate_row


class Jev:
    def __init__(
        self,
        cfg: JevConfig,
        games: Dict[str, Dict[str, Any]],
        sheet_ids: Dict[str, str],
        reader: Any,  # SheetReader-like: read_tail(sheet_id, tail) -> (header, rows, ms)
        store: Any,  # Store-like: results_on_dates, insert_result, latest_results
        cache: ResultsCache,
        router: Router,
        jobs: JobQueue,
        post_publish: Optional[Callable[[str], Any]] = None,  # sync fn(game), runs in the background
        now: Optional[Callable[[], datetime]] = None,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ):
        self.cfg, self.games, self.sheet_ids = cfg, games, sheet_ids
        self.reader, self.store, self.cache, self.router, self.jobs = reader, store, cache, router, jobs
        self.post_publish = post_publish
        self.now = now or (lambda: schedule.now_local(cfg))
        self.sleep = sleep
        self.last_sync: Dict[str, datetime] = {}
        self.last_result: Dict[str, Dict[str, Any]] = {}
        self.failures: Dict[str, int] = {}
        self.counters = {"syncs": 0, "sync_ok": 0, "sync_failed": 0, "sheet_quota_errors": 0, "published": 0, "held": 0}
        self.publish_latency_s: List[Dict[str, Any]] = []  # recent publishes: draw->publish, edit->publish
        self._locks: Dict[str, asyncio.Lock] = {}

    # --- reading -------------------------------------------------------------
    async def _read_with_retry(self, game: str):
        backoff: Sequence[float] = self.cfg.sync["retry_backoff_seconds"]
        last_err: Optional[Exception] = None
        for attempt in range(len(backoff) + 1):
            try:
                return await asyncio.to_thread(self.reader.read_tail, self.sheet_ids[game], int(self.cfg.sync["tail_rows"]))
            except SheetError as e:
                last_err = e
                if e.is_quota:
                    self.counters["sheet_quota_errors"] += 1
                if attempt < len(backoff):
                    await self.sleep(float(backoff[attempt]))
        raise last_err  # type: ignore[misc]

    # --- one game ------------------------------------------------------------
    async def sync_game(self, game: str, reason: str, edited_at: Optional[datetime] = None) -> Dict[str, Any]:
        lock = self._locks.setdefault(game, asyncio.Lock())
        async with lock:
            return await self._sync_game(game, reason, edited_at)

    async def _sync_game(self, game: str, reason: str, edited_at: Optional[datetime]) -> Dict[str, Any]:
        t0 = time.perf_counter()
        now = self.now()
        self.counters["syncs"] += 1
        self.last_sync[game] = now
        out: Dict[str, Any] = {"game": game, "reason": reason, "published": [], "held": [], "rejected": 0}

        try:
            header, rows, read_ms = await self._read_with_retry(game)
        except SheetError as e:
            return self._sync_failed(game, reason, f"Sheet read failed after retries: {e}", t0,
                                     "quota" if e.is_quota else "sync_failing", out)

        try:
            cols = column_map(header)
        except ValueError as e:
            return self._sync_failed(game, reason, str(e), t0, "sync_failing", out)

        rules = self.games[game]
        today = now.date()
        candidates: List[Candidate] = []
        for row_no, cells in rows:
            v = validate_row(
                game, rules, cols, cells,
                today=today,
                draw_days=self.cfg.draw_days[game],
                no_draw_dates=self.cfg.no_draw_dates,
                hold_off_schedule=bool(self.cfg.validate["hold_off_schedule_dates"]),
                source="sheet", source_ref=f"row {row_no}",
            )
            if v is None:
                continue
            if isinstance(v, Rejected):
                out["rejected"] += 1
                alerts.alert("held" if v.hold else "invalid_row", game,
                             f"{game} Sheet {v.source_ref}: " + "; ".join(v.reasons) + ". Not published.",
                             key=f"{v.source_ref}|{v.raw}")
                decisions.log("trust", game, "validate", "; ".join(v.reasons), "held", None, row=v.source_ref)
                continue
            candidates.append(v)

        result = await self._decide_and_publish(game, candidates, now, edited_at, out)
        self.cache.mark_synced(game)
        self.failures[game] = 0
        self.counters["sync_ok"] += 1
        decisions.log("sync", game, "sheet_tail", reason, "ok", (time.perf_counter() - t0) * 1000,
                      read_ms=round(read_ms, 1), rows_read=len(rows), published=len(out["published"]),
                      held=len(out["held"]), rejected=out["rejected"])
        return result

    def _sync_failed(self, game: str, reason: str, message: str, t0: float, kind: str, out: Dict[str, Any]) -> Dict[str, Any]:
        self.failures[game] = self.failures.get(game, 0) + 1
        self.counters["sync_failed"] += 1
        decisions.log("sync", game, "sheet_tail", f"{reason}: {message}", "error", (time.perf_counter() - t0) * 1000)
        if kind == "quota" or self.failures[game] >= int(self.cfg.sync["failed_sync_alert_after"]):
            alerts.alert(kind, game, f"{game}: {message} ({self.failures[game]} failed in a row). Showing last good data.")
        out.update(ok=False, error=message)
        return out

    async def _decide_and_publish(self, game: str, candidates: List[Candidate], now: datetime,
                                  edited_at: Optional[datetime], out: Dict[str, Any]) -> Dict[str, Any]:
        out["ok"] = True
        if not candidates:
            return out
        dates_iso = {datetime(c.draw_date.year, c.draw_date.month, c.draw_date.day).isoformat() for c in candidates}
        existing_rows = await asyncio.to_thread(self.store.results_on_dates, game, dates_iso)
        published_by_date: Dict[date, set] = {}
        for r in existing_rows:
            d = date.fromisoformat(str(r.get("draw_date"))[:10])
            published_by_date.setdefault(d, set()).add(numbers_of(r))

        oldest_new_ok = now.date() - timedelta(days=int(self.cfg.validate["max_backfill_days"]))
        for group in trust.group_by_draw(candidates):
            day = group[0].draw_date
            decision = trust.decide(group, sorted(published_by_date.get(day, set())),
                                    scraper_can_publish=bool(self.cfg.trust["scraper_can_publish"]))
            if decision.action == trust.PUBLISH and day < oldest_new_ok:
                decision = trust.Decision(trust.HOLD, "too_old_to_backfill", decision.candidate,
                                          alert=f"{game} {day}: new to the database but older than "
                                                f"{self.cfg.validate['max_backfill_days']} days. Not published; check it.")
            if decision.alert:
                alerts.alert("conflict" if decision.action != trust.PUBLISH else "source_mismatch", game, decision.alert, key=f"{day}|{decision.reason}")

            if decision.action == trust.PUBLISH:
                await self._publish(game, decision, now, edited_at, out)
                published_by_date.setdefault(day, set()).add(decision.candidate.numbers)
            elif decision.action == trust.HOLD:
                self.counters["held"] += 1
                out["held"].append({"draw_date": day.isoformat(), "reason": decision.reason})
                decisions.log("trust", game, "hold", decision.reason, "held", None, draw_date=day.isoformat())
        return out

    async def _publish(self, game: str, decision: trust.Decision, now: datetime,
                       edited_at: Optional[datetime], out: Dict[str, Any]) -> None:
        c = decision.candidate
        t0 = time.perf_counter()
        row = c.to_db_row()
        if not decision.verified:
            row["source"] = "scraper_unverified"
        rid = await asyncio.to_thread(self.store.insert_result, game, row)
        write_ms = (time.perf_counter() - t0) * 1000
        self.cache.invalidate(game)  # open pages hear about it on the next stream check (about 1 s)
        self.counters["published"] += 1
        now = self.now()  # time of the write, not of the sync start

        draw_time = schedule.draw_at(self.cfg, c.draw_date)
        lat = {"game": game, "draw_date": c.draw_date.isoformat(),
               "published_at": now.isoformat(),
               "draw_to_publish_s": round((now - draw_time).total_seconds(), 1),
               "edit_to_publish_s": round((now - edited_at).total_seconds(), 1) if edited_at else None}
        self.publish_latency_s = (self.publish_latency_s + [lat])[-50:]
        self.last_result[game] = {"draw_date": c.draw_date.isoformat(), "numbers": list(c.numbers), "id": rid}
        out["published"].append({"draw_date": c.draw_date.isoformat(), "numbers": list(c.numbers), "id": rid})
        decisions.log("publish", game, "sheet" if decision.verified else "scraper", decision.reason, "ok", write_ms,
                      draw_date=c.draw_date.isoformat(), **{k: v for k, v in lat.items() if k.endswith("_s")})

        if self.post_publish is not None:
            key = f"post_publish_analysis|{game}|{c.draw_date.isoformat()}"
            fn = self.post_publish

            async def run() -> None:
                await self.router.run("post_publish_analysis", {"game": game, "draw_date": c.draw_date.isoformat()},
                                      {"ml:post_publish": lambda p: fn(p["game"])}, cache_key=key)

            self.jobs.enqueue(key, run)

    # --- scraper input -----------------------------------------------------------
    async def ingest_scraper_rows(self, game: str, rows: List[Dict[str, Any]], source: str = "scraper") -> Dict[str, Any]:
        """Rows shaped like database rows (draw_date, number_1..6, jackpot, winners) from a bot."""
        now = self.now()
        cols = {"combination": 0, "date": 1, "jackpot": 2, "winners": 3}
        candidates: List[Candidate] = []
        out: Dict[str, Any] = {"game": game, "reason": source, "published": [], "held": [], "rejected": 0}
        for i, r in enumerate(rows):
            cells = ["-".join(str(r.get(f"number_{k}", "")) for k in range(1, 7)),
                     str(r.get("draw_date") or "")[:10], r.get("jackpot"), r.get("winners")]
            v = validate_row(game, self.games[game], cols, cells, today=now.date(),
                             draw_days=self.cfg.draw_days[game], no_draw_dates=self.cfg.no_draw_dates,
                             hold_off_schedule=bool(self.cfg.validate["hold_off_schedule_dates"]),
                             source=source, source_ref=f"{source} item {i}")
            if isinstance(v, Candidate):
                candidates.append(v)
            elif isinstance(v, Rejected):
                out["rejected"] += 1
                decisions.log("trust", game, "validate", "; ".join(v.reasons), "held", None, row=v.source_ref)
        lock = self._locks.setdefault(game, asyncio.Lock())
        async with lock:
            return await self._decide_and_publish(game, candidates, now, None, out)

    # --- schedule ------------------------------------------------------------
    async def tick(self) -> Dict[str, Any]:
        """Called by Cloud Scheduler every minute. Syncs the games that are due, flags overdue draws."""
        now = self.now()
        report: Dict[str, Any] = {}
        due_games = []
        for game in self.sheet_ids:
            due, why = schedule.sync_due(self.cfg, game, now, self.last_sync.get(game))
            report[game] = {"due": due, "why": why}
            if due:
                due_games.append((game, why))
        results = await asyncio.gather(*(self.sync_game(g, f"tick:{why}") for g, why in due_games))
        for (game, _), res in zip(due_games, results):
            report[game]["sync"] = {k: res.get(k) for k in ("ok", "published", "held", "rejected", "error")}
        for game in self.sheet_ids:
            latest = self._latest_published_date(game)
            missing = schedule.overdue_draw(self.cfg, game, now, latest)
            if missing:
                report[game]["overdue"] = missing.isoformat()
                alerts.alert("missing_result", game,
                             f"{game}: no result for the {missing.isoformat()} draw "
                             f"{self.cfg.sync['missing_result_alert_minutes']} min after draw time. Add it to the Sheet.",
                             key=missing.isoformat())
        return report

    def _latest_published_date(self, game: str) -> Optional[date]:
        try:
            rows, _ = self.cache.latest(game, 1)
        except Exception:
            return None
        if not rows:
            return None
        return date.fromisoformat(str(rows[0].get("draw_date"))[:10])

    def status(self) -> Dict[str, Any]:
        now = self.now()
        games = {}
        for game in self.sheet_ids:
            last_draw = schedule.last_draw(self.cfg, game, now)
            latest = self._latest_published_date(game)
            games[game] = {
                "latest_published_draw": latest.isoformat() if latest else None,
                "last_scheduled_draw": last_draw.isoformat() if last_draw else None,
                "in_draw_window": schedule.in_window(self.cfg, game, now),
                "last_sync": self.last_sync[game].isoformat() if game in self.last_sync else None,
                "failed_syncs_in_a_row": self.failures.get(game, 0),
                "overdue_draw": (d.isoformat() if (d := schedule.overdue_draw(self.cfg, game, now, latest)) else None),
            }
        c = self.counters
        return {
            "now": now.isoformat(),
            "games": games,
            "sync_success_rate": round(c["sync_ok"] / c["syncs"], 3) if c["syncs"] else None,
            "counters": c,
            "cache": self.cache.stats(),
            "recent_publish_latency": self.publish_latency_s[-10:][::-1],
            "jobs": self.jobs.snapshot(10),
            "alerts": alerts.recent(20),
        }
