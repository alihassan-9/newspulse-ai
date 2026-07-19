"""JournalistAgent: optional grounded research brief.

Accuracy rule: the model may only use the article text passed to it, and must
cite or omit. Provider-agnostic: the LLM "brain" runs either locally via Ollama
(free, no key) or on Google Gemini, selected by LLM_PROVIDER. Degrades to None
when the provider is unavailable, so the app still works.
"""

import json
import logging

import httpx

from app.config import settings
from app.models import NewsEvent

log = logging.getLogger("agent.journalist")

_GEMINI_MODEL = "gemini-2.0-flash"
_GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{_GEMINI_MODEL}:generateContent"


class JournalistAgent:
    name = "AI Journalist"

    @property
    def provider(self) -> str:
        return settings.llm_provider

    @property
    def enabled(self) -> bool:
        if self.provider == "ollama":
            return True  # local model; run() degrades gracefully if the daemon is down
        return bool(settings.gemini_api_key)

    @property
    def detail(self) -> str:
        if self.provider == "ollama":
            return f"Local · Ollama ({settings.ollama_model})"
        return "Gemini key set" if settings.gemini_api_key else "set GEMINI_API_KEY or LLM_PROVIDER=ollama"

    async def run(self, event: NewsEvent, body: list[str]) -> dict | None:
        if not self.enabled:
            return None
        source_text = "\n\n".join(body) if body else event.summary
        prompt = (
            "You are a precise news analyst. Using ONLY the source text below, write a neutral brief. "
            "If a fact is not present in the source, do not include it. Do not use dashes in your writing. "
            'Return STRICT JSON with keys: "summary" (2 sentences), '
            '"why_it_matters" (1 sentence), "key_facts" (array of up to 5 short strings). '
            f"\n\nHEADLINE: {event.title}\n\nSOURCE TEXT:\n{source_text[:6000]}"
        )
        try:
            text = await (self._ollama(prompt) if self.provider == "ollama" else self._gemini(prompt))
            if text is None:
                return {"available": False, "reason": f"{self.provider} unavailable"}
            parsed = json.loads(text)
            parsed["available"] = True
            return parsed
        except Exception as exc:
            log.warning("journalist failed: %s", exc)
            return {"available": False, "reason": str(exc)[:120]}

    async def _gemini(self, prompt: str) -> str | None:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                _GEMINI_ENDPOINT,
                headers={"content-type": "application/json", "x-goog-api-key": settings.gemini_api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
                timeout=30.0,
            )
        if resp.status_code != 200:
            log.warning("gemini HTTP %s", resp.status_code)
            return None
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    async def _ollama(self, prompt: str) -> str | None:
        """Call a local Ollama model. `format: json` constrains it to valid JSON."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.2},
                },
                timeout=120.0,  # local models can be slow on first token
            )
        if resp.status_code != 200:
            log.warning("ollama HTTP %s", resp.status_code)
            return None
        return resp.json().get("response")
