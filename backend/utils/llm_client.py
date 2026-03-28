"""OpenAI-compatible chat client for council / summaries."""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

from openai import OpenAI

from config import Config

logger = logging.getLogger(__name__)


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
