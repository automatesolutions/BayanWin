"""
Background queue for work that follows a publish (accuracy, DRL learning, stats refresh).
One worker per process runs jobs in order. A job key (task|game|draw) runs once, so a
draw seen by several syncs is analyzed once. Publishing never waits on this queue.
"""
from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from typing import Any, Awaitable, Callable, Dict, Optional

from jev import decisions

MAX_TRACKED = 500


class JobQueue:
    def __init__(self) -> None:
        self._queue: Optional[asyncio.Queue] = None
        self._worker: Optional[asyncio.Task] = None
        self.jobs: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()

    def _ensure_worker(self) -> None:
        if self._queue is None:
            self._queue = asyncio.Queue()
        if self._worker is None or self._worker.done():
            self._worker = asyncio.get_running_loop().create_task(self._run())

    def enqueue(self, key: str, run: Callable[[], Awaitable[Any]]) -> bool:
        """Queue `run` under `key`. Returns False if that key is already queued, running or done."""
        if key in self.jobs and self.jobs[key]["status"] != "failed":
            return False
        self._ensure_worker()
        self.jobs[key] = {"status": "queued", "queued_at": time.time()}
        while len(self.jobs) > MAX_TRACKED:
            self.jobs.popitem(last=False)
        self._queue.put_nowait((key, run))
        return True

    async def _run(self) -> None:
        while True:
            key, run = await self._queue.get()
            job = self.jobs.setdefault(key, {})
            job.update(status="running", started_at=time.time())
            t0 = time.perf_counter()
            try:
                await run()
                job["status"] = "done"
                outcome = "ok"
            except Exception as e:  # noqa: BLE001 - a failed job must not stop the worker
                job.update(status="failed", error=str(e)[:300])
                outcome = "error"
            job["seconds"] = round(time.perf_counter() - t0, 2)
            decisions.log("job", key.split("|", 1)[0], "background", key, outcome, job["seconds"] * 1000)
            self._queue.task_done()

    async def drain(self) -> None:
        """Wait until every queued job has finished (used by tests)."""
        if self._queue is not None:
            await self._queue.join()

    def snapshot(self, limit: int = 20) -> list:
        return [{"key": k, **v} for k, v in list(self.jobs.items())[-limit:]][::-1]
