import asyncio
import dataclasses
import time

import pytest

from jev import decisions
from jev.config import Route
from jev.router import PENDING, RouteFailed, Router

ENV = {"LLM_API_KEY": "x", "LLM_MODEL_NAME": "big-model", "JEV_SMALL_MODEL": "small-model"}


def router_with(cfg, task, chain, timeout=1.0, cap=None, cache=None, env=ENV):
    routes = dict(cfg.routes)
    routes[task] = Route(task, tuple(chain), timeout, cap, cache)
    return Router(dataclasses.replace(cfg, routes=routes), env=env)


def run(r, task, impls, key=None):
    return asyncio.run(r.run(task, {"x": 1}, impls, cache_key=key))


def test_first_choice_ok_and_logged(cfg):
    r = router_with(cfg, "t", ["llm:large", "code:vote"])
    res = run(r, "t", {"llm": lambda p, m: f"answer from {m}", "code:vote": lambda p: "vote"})
    assert res.value == "answer from big-model" and res.option == "llm:large" and res.outcome == "ok"
    last = decisions.recent(1)[0]
    assert last["task"] == "t" and last["option"] == "llm:large" and last["outcome"] == "ok"


def test_timeout_falls_back_to_next_option(cfg):
    r = router_with(cfg, "t", ["llm:large", "code:vote"], timeout=0.2)
    res = run(r, "t", {"llm": lambda p, m: time.sleep(1), "code:vote": lambda p: [1, 2, 3, 4, 5, 6]})
    assert res.option == "code:vote" and res.outcome == "fallback"
    assert "timed out" in res.attempts[0]["reason"]


def test_error_falls_back_to_small_model(cfg):
    def llm(p, model):
        if model == "big-model":
            raise RuntimeError("rate limited")
        return "small ok"
    res = run(router_with(cfg, "t", ["llm:large", "llm:small"]), "t", {"llm": llm})
    assert res.value == "small ok" and res.option == "llm:small"


def test_small_model_skipped_when_not_configured(cfg):
    env = {k: v for k, v in ENV.items() if k != "JEV_SMALL_MODEL"}
    r = router_with(cfg, "t", ["llm:small", "code:vote"], env=env)
    res = run(r, "t", {"llm": lambda p, m: "never", "code:vote": lambda p: "vote"})
    assert res.option == "code:vote" and "not set" in res.attempts[0]["reason"]


def test_no_llm_key_skips_models(cfg):
    r = router_with(cfg, "t", ["llm:large", "pending"], env={})
    res = run(r, "t", {"llm": lambda p, m: "never"})
    assert res.outcome == "pending" and res.value == PENDING


def test_cached_fallback_returns_last_good_output(cfg):
    r = router_with(cfg, "t", ["llm:large", "cached", "pending"])
    assert run(r, "t", {"llm": lambda p, m: "good"}, key="6/58|2026-10-27").value == "good"

    def boom(p, m):
        raise RuntimeError("down")
    res = run(r, "t", {"llm": boom}, key="6/58|2026-10-27")
    assert res.outcome == "cached" and res.value == "good"
    # A different draw has nothing cached, so it ends at "Analysis coming soon".
    assert run(r, "t", {"llm": boom}, key="other").outcome == "pending"


def test_per_draw_cache_skips_the_call(cfg):
    calls = []
    r = router_with(cfg, "t", ["ml:job", "pending"], cache="per_draw")
    impl = {"ml:job": lambda p: calls.append(1) or "done"}
    run(r, "t", impl, key="k")
    res = run(r, "t", impl, key="k")
    assert res.option == "cache_hit" and len(calls) == 1


def test_cost_cap_moves_to_fallback(cfg):
    r = router_with(cfg, "t", ["llm:large", "code:vote"], cap=0.001)
    r._add_spend("t", 0.002)
    res = run(r, "t", {"llm": lambda p, m: "expensive", "code:vote": lambda p: "vote"})
    assert res.option == "code:vote" and "cost cap" in res.attempts[0]["reason"]


def test_cost_is_computed_from_token_usage(cfg, monkeypatch):
    from jev import router as router_mod

    def fake_with_usage(usage, fn, payload, model):
        usage.append({"prompt_tokens": 1_000_000, "completion_tokens": 1_000_000})
        return fn(payload, model)
    monkeypatch.setattr(router_mod, "_with_usage", fake_with_usage)
    r = router_with(cfg, "t", ["llm:large"])
    res = run(r, "t", {"llm": lambda p, m: "ok"})
    expected = cfg.models["large_price_in"] + cfg.models["large_price_out"]
    assert res.cost_usd == pytest.approx(expected) and r.spent_today("t") == pytest.approx(expected)


def test_every_option_failing_raises(cfg):
    def boom(p, *a):
        raise RuntimeError("down")
    with pytest.raises(RouteFailed) as e:
        run(router_with(cfg, "t", ["llm:large", "code:vote"]), "t", {"llm": boom, "code:vote": boom})
    assert len(e.value.attempts) == 2


def test_summary_groups_routes(cfg):
    r = router_with(cfg, "t", ["llm:large", "code:vote"], timeout=0.1)
    run(r, "t", {"llm": lambda p, m: time.sleep(0.5), "code:vote": lambda p: "v"})
    rows = {f"{x['task']}:{x['option']}": x for x in decisions.summary()["routes"]}
    assert rows["t:llm:large"]["outcomes"] == {"error": 1}
    assert rows["t:code:vote"]["outcomes"] == {"fallback": 1}
