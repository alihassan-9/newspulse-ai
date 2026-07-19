"""ImageAgent: optional AI post image via Google Gemini (Nano Banana).

Generates a shareable post image for a news event using Gemini 2.5 Flash Image
(nicknamed "Nano Banana"). The article text is used only to ground the visual
concept. Same trusted-source, provider-agnostic-friendly REST call as the
journalist. Degrades to None when no key is configured or the model/quota is
unavailable, so the app still works.
"""

import logging

import httpx

from app.config import settings
from app.models import NewsEvent

log = logging.getLogger("agent.image")

# Nano Banana. For higher quality swap to "gemini-3-pro-image-preview" (Nano Banana Pro).
_MODEL = "gemini-2.5-flash-image"
_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{_MODEL}:generateContent"


class ImageAgent:
    name = "AI Post Image"

    @property
    def enabled(self) -> bool:
        return bool(settings.gemini_api_key)

    async def run(self, event: NewsEvent, body: list[str]) -> str | None:
        """Return a data URI (data:image/png;base64,...) or None on failure."""
        if not self.enabled:
            return None
        source_text = "\n\n".join(body) if body else event.summary
        prompt = (
            "Create a clean, professional 16:9 news post image for a social media update. "
            "Use an editorial illustration style, neutral and non sensational. "
            "Do not put any text, words, letters, logos, or watermarks in the image. "
            "Base the visual concept only on this story.\n\n"
            f"HEADLINE: {event.title}\n\nCONTEXT:\n{source_text[:2000]}"
        )
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    _ENDPOINT,
                    headers={"content-type": "application/json", "x-goog-api-key": settings.gemini_api_key},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=60.0,
                )
            if resp.status_code != 200:
                log.warning("image HTTP %s", resp.status_code)
                return None
            data = resp.json()
            for part in data["candidates"][0]["content"]["parts"]:
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                    return f"data:{mime};base64,{inline['data']}"
            return None
        except Exception as exc:
            log.warning("image agent failed: %s", exc)
            return None
