"""OpenAI-compatible chat client for council / summaries."""
from __future__ import annotations

import json
import logging
import re
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, Dict, Iterator, List, Optional

from openai import OpenAI

from config import Config

logger = logging.getLogger(__name__)

# Token usage sink for the current call stack (set by jev.router to log cost per route).
_usage_sink: ContextVar[Optional[List[Dict[str, int]]]] = ContextVar("llm_usage_sink", default=None)


@contextmanager
def collect_usage(sink: List[Dict[str, int]]) -> Iterator[None]:
    token = _usage_sink.set(sink)
    try:
        yield
    finally:
        _usage_sink.reset(token)


class LLMClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or Config.LLM_API_KEY
        self.base_url = (base_url or Config.LLM_BASE_URL or "").rstrip("/") or "https://api.openai.com/v1"
        self.model = model or Config.LLM_MODEL_NAME or "gpt-4o-mini"
        if not self.api_key:
            raise ValueError("LLM_API_KEY is not configured")
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)

    @staticmethod
    def _strip_think(content: str) -> str:
        return re.sub(r"<think>[\s\S]*?</think>", "", content or "").strip()

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.5,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> str:
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            kwargs["response_format"] = response_format
        try:
            response = self.client.chat.completions.create(**kwargs)
            sink = _usage_sink.get()
            if sink is not None and getattr(response, "usage", None) is not None:
                sink.append({
                    "prompt_tokens": int(response.usage.prompt_tokens or 0),
                    "completion_tokens": int(response.usage.completion_tokens or 0),
                })
            content = response.choices[0].message.content or ""
            return self._strip_think(content)
        except Exception as e:
            logger.error("LLM chat failed: %s", e)
            raise

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        fmt = {"type": "json_object"}
        content = self.chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=fmt,
        )
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            m = re.search(r"\{[\s\S]*\}", content)
            if m:
                return json.loads(m.group(0))
            raise
