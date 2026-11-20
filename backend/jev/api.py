"""Jev HTTP endpoints and the process-wide Jev instance."""
from __future__ import annotations

import asyncio
import hmac
import json
import os
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from fastapi import APIRouter, Body, Header, HTTPException, Request
from fastapi.responses import StreamingResponse

from jev import config as jev_config
from jev import decisions, schedule
from jev import store as jev_store
from jev.cache import ResultsCache
from jev.jobs import JobQueue
from jev.router import Router
from jev.sheet import SheetReader
from jev.sync import Jev

router = APIRouter()

_jev: Optional[Jev] = None
_post_publish: Optional[Callable[[str], Any]] = None


def set_post_publish(fn: Callable[[str], Any]) -> None:
    """app.py registers the background work to run after each publish (accuracy, DRL, stats caches)."""
    global _post_publish
    _post_publish = fn
    if _jev is not None:
        _jev.post_publish = fn


def get_jev() -> Jev:
    global _jev
    if _jev is None:
        from config import Config

        cfg = jev_config.get()
        store = jev_store.get()

        def fresh(game: str) -> float:
            inside = schedule.in_window(cfg, game, schedule.now_local(cfg))
            return float(cfg.cache["fresh_seconds_in_window" if inside else "fresh_seconds_idle"])

        cache = ResultsCache(store.latest_results, int(cfg.cache["latest_count"]), fresh)
        reader = SheetReader(str(Config.GOOGLE_SERVICE_ACCOUNT_FILE or ""), Config.SHEETS_WORKSHEET_NAME,
                             float(cfg.sync["sheet_timeout_seconds"]))
        _jev = Jev(cfg, Config.GAMES, Config.GOOGLE_SHEETS, reader, store, cache, Router(cfg), JobQueue(),
                   post_publish=_post_publish)
    return _jev


def _check_secret(given: Optional[str], env_name: str) -> None:
    expected = (os.getenv(env_name) or "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail=f"{env_name} is not configured on the server")
    if not given or not hmac.compare_digest(given.strip(), expected):
        raise HTTPException(status_code=401, detail="Invalid or missing secret header")


@router.post("/api/jev/tick")
async def jev_tick(x_scrape_cron_secret: Optional[str] = Header(None, alias="X-Scrape-Cron-Secret")):
    """Cloud Scheduler calls this every minute. Jev decides which games to sync."""
    _check_secret(x_scrape_cron_secret, "CRON_SCRAPE_SECRET")
    return await get_jev().tick()


@router.post("/api/jev/sheet-edited")
async def jev_sheet_edited(
    body: Dict[str, Any] = Body(...),
    x_jev_sheet_secret: Optional[str] = Header(None, alias="X-Jev-Sheet-Secret"),
):
    """The Apps Script in each Sheet calls this when you save a row: {sheet_id, edited_at}."""
    _check_secret(x_jev_sheet_secret, "JEV_SHEET_SECRET")
    jev = get_jev()
    game = body.get("game_type")
    if not game:
        sid = str(body.get("sheet_id") or "")
        game = next((g for g, s in jev.sheet_ids.items() if s == sid), None)
    if game not in jev.sheet_ids:
        raise HTTPException(status_code=400, detail="Unknown sheet_id or game_type")
    edited_at = None
    if body.get("edited_at"):
        try:
            edited_at = datetime.fromisoformat(str(body["edited_at"]).replace("Z", "+00:00"))
        except ValueError:
            edited_at = None
    return await jev.sync_game(game, "sheet_edited", edited_at=edited_at)


@router.get("/api/jev/status")
async def jev_status(x_jev_admin_secret: Optional[str] = Header(None, alias="X-Jev-Admin-Secret")):
    _check_secret(x_jev_admin_secret, "JEV_ADMIN_SECRET")
    return await asyncio.to_thread(get_jev().status)


@router.get("/api/jev/summary")
async def jev_summary(x_jev_admin_secret: Optional[str] = Header(None, alias="X-Jev-Admin-Secret"), limit: int = 50):
    """Which routes are slow or costly, plus the latest decisions."""
    _check_secret(x_jev_admin_secret, "JEV_ADMIN_SECRET")
    return {**decisions.summary(), "recent": decisions.recent(min(max(limit, 1), 500))}


def _sse(event: str, data: Dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.get("/api/results/stream")
async def results_stream(request: Request):
    """Server-Sent Events: a `result` event whenever a game's newest draw changes."""
    jev = get_jev()
    cfg = jev.cfg
    games = list(jev.sheet_ids)

    async def events():
        # Say hello first so the browser sees the stream open, then learn each game's newest draw.
        yield "retry: 5000\n\n"
        yield _sse("hello", {"games": games})
        seen = {}
        for g in games:
            try:
                seen[g] = await asyncio.to_thread(jev.cache.fingerprint, g)
            except Exception:
                seen[g] = None
        bumps = jev.cache.local_bumps
        since_ping = 0.0
        while True:
            now = schedule.now_local(cfg)
            busy = any(schedule.in_window(cfg, g, now) for g in games)
            interval = float(cfg.cache["stream_check_seconds_in_window" if busy else "stream_check_seconds_idle"])
            waited = 0.0
            while waited < interval and jev.cache.local_bumps == bumps:
                await asyncio.sleep(1)
                waited += 1
            if await request.is_disconnected():
                return
            bumps = jev.cache.local_bumps
            since_ping += waited
            for g in games:
                try:
                    fp = await asyncio.to_thread(jev.cache.fingerprint, g)
                except Exception:
                    continue
                if fp != seen.get(g):
                    seen[g] = fp
                    yield _sse("result", {"game_type": g, "latest": fp.split("|")[0] if fp else None,
                                          "last_synced_at": jev.cache.last_synced_at.get(g)})
            if since_ping >= 25:
                since_ping = 0.0
                yield ": ping\n\n"

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(events(), media_type="text/event-stream", headers=headers)
