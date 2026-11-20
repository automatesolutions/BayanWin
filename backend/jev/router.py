"""
Model and ML routing. Each task has a chain in jev.toml, e.g.
    miro_pick: llm:large -> llm:small -> code:vote -> cached
Jev tries each option with the route's timeout and logs every attempt.

Callers pass the task's implementations:
    impls = {"llm": fn(payload, model_name), "code:vote": fn(payload), "ml:post_publish": fn(payload)}
"cached" (last good output for the same cache key) and "pending" are built in.
Note: a timed-out call keeps running in its worker thread; Jev just stops waiting for it.
"""
from __future__ import annotations

import asyncio
import os
import threading
import time
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Callable, Dict, List, Optional, Tuple

from jev import decisions
from jev.config import JevConfig

PENDING = {"status": "pending", "message": "Analysis coming soon"}


class RouteFailed(RuntimeError):
    def __init__(self, task: str, attempts: List[Dict[str, Any]]):
        self.task, self.attempts = task, attempts
        super().__init__(f"Every option failed for {task}: " + "; ".join(f"{a['option']}={a['reason']}" for a in attempts))


@dataclass
class RouteResult:
    task: str
    value: Any
    option: str
    outcome: str  # ok | fallback | cached | pending
    latency_ms: float
    cost_usd: float
    attempts: List[Dict[str, Any]] = field(default_factory=list)


class Router:
    def __init__(self, cfg: JevConfig, *, llm_key_present: Optional[Callable[[], bool]] = None,
                 env: Optional[Dict[str, str]] = None, today: Callable[[], date] = date.today):
        self.cfg = cfg
        self._env = env if env is not None else os.environ
        self._llm_key_present = llm_key_present or (lambda: bool(self._env.get("LLM_API_KEY")))
        self._today = today
        self._cache: Dict[Tuple[str, str], Any] = {}
        self._spent: Dict[Tuple[str, date], float] = {}
        self._lock = threading.Lock()

    # --- models -----------------------------------------------------------
    def model_name(self, tier: str) -> Optional[str]:
        env_name = self.cfg.models[f"{tier}_env"]
        value = (self._env.get(env_name) or "").strip()
        if not value and tier == "large":
            value = "gpt-4o-mini"  # same default as Config.LLM_MODEL_NAME
        return value or None

    def _price(self, tier: str) -> Tuple[float, float]:
        m = self.cfg.models
        return float(m.get(f"{tier}_price_in", 0)), float(m.get(f"{tier}_price_out", 0))

    def spent_today(self, task: str) -> float:
        with self._lock:
            return self._spent.get((task, self._today()), 0.0)

    def _add_spend(self, task: str, usd: float) -> None:
        with self._lock:
            k = (task, self._today())
            self._spent[k] = self._spent.get(k, 0.0) + usd

    # --- cache ------------------------------------------------------------
    def cached(self, task: str, cache_key: Optional[str]) -> Any:
        with self._lock:
            return self._cache.get((task, cache_key or ""))

    def _store(self, task: str, cache_key: Optional[str], value: Any) -> None:
        with self._lock:
            self._cache[(task, cache_key or "")] = value

    # --- run --------------------------------------------------------------
    async def run(self, task: str, payload: Any, impls: Dict[str, Callable], cache_key: Optional[str] = None) -> RouteResult:
        route = self.cfg.route(task)
        attempts: List[Dict[str, Any]] = []
        started = time.perf_counter()
        total_cost = 0.0

        if route.cache == "per_draw" and cache_key:
            hit = self.cached(task, cache_key)
            if hit is not None:
                decisions.log("route", task, "cache_hit", f"cached for {cache_key}", "ok", 0.0)
                return RouteResult(task, hit, "cache_hit", "ok", 0.0, 0.0)

        for i, option in enumerate(route.chain):
            kind = option.split(":", 1)[0]
            t0 = time.perf_counter()

            if option == "pending":
                decisions.log("route", task, option, "every earlier option failed", "fallback", 0.0, attempts=attempts)
                return RouteResult(task, dict(PENDING), option, "pending", (time.perf_counter() - started) * 1000, total_cost, attempts)

            if option == "cached":
                hit = self.cached(task, cache_key)
                if hit is not None:
                    decisions.log("route", task, option, "using last good output", "fallback", 0.0, attempts=attempts)
                    return RouteResult(task, hit, option, "cached", (time.perf_counter() - started) * 1000, total_cost, attempts)
                attempts.append({"option": option, "reason": "nothing cached"})
                continue

            skip = None
            fn = impls.get("llm") if kind == "llm" else impls.get(option)
            model = None
            if fn is None:
                skip = "not implemented for this task"
            elif kind == "llm":
                tier = option.split(":", 1)[1]
                model = self.model_name(tier)
                cap = route.cost_cap_usd_per_day
                if not self._llm_key_present():
                    skip = "no LLM_API_KEY"
                elif model is None:
                    skip = f"{self.cfg.models[f'{tier}_env']} not set"
                elif cap is not None and self.spent_today(task) >= cap:
                    skip = f"daily cost cap ${cap:.2f} reached"
            if skip:
                attempts.append({"option": option, "reason": skip})
                decisions.log("route", task, option, skip, "skipped", 0.0)
                continue

            usage: List[Dict[str, int]] = []
            try:
                call = (lambda: _with_usage(usage, fn, payload, model)) if kind == "llm" else (lambda: fn(payload))
                value = await asyncio.wait_for(asyncio.to_thread(call), timeout=route.timeout_seconds)
            except asyncio.TimeoutError:
                reason = f"timed out after {route.timeout_seconds:.0f}s"
                value = None
            except Exception as e:  # noqa: BLE001 - any failure moves to the next option
                reason = f"{type(e).__name__}: {str(e)[:160]}"
                value = None
            else:
                reason = None

            ms = (time.perf_counter() - t0) * 1000
            cost = 0.0
            if kind == "llm" and usage:
                p_in, p_out = self._price(option.split(":", 1)[1])
                cost = sum(u.get("prompt_tokens", 0) for u in usage) * p_in / 1e6 + sum(u.get("completion_tokens", 0) for u in usage) * p_out / 1e6
                self._add_spend(task, cost)
                total_cost += cost

            if reason is None:
                outcome = "ok" if i == 0 else "fallback"
                if route.cache == "per_draw" or "cached" in route.chain:
                    self._store(task, cache_key, value)
                decisions.log("route", task, option, "first choice" if i == 0 else "fallback after: " + attempts[-1]["reason"],
                              outcome, ms, cost, model=model, cache_key=cache_key)
                return RouteResult(task, value, option, outcome, (time.perf_counter() - started) * 1000, total_cost, attempts)

            attempts.append({"option": option, "reason": reason, "latency_ms": round(ms, 1)})
            decisions.log("route", task, option, reason, "error", ms, cost, model=model)

        raise RouteFailed(task, attempts)


def _with_usage(usage: List[Dict[str, int]], fn: Callable, payload: Any, model: Optional[str]) -> Any:
    """Run an LLM handler while collecting token usage from utils.llm_client."""
    try:
        from utils import llm_client
    except Exception:  # tests run without the OpenAI SDK installed
        return fn(payload, model)
    with llm_client.collect_usage(usage):
        return fn(payload, model)
