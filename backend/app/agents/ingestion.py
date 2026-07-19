"""IngestionAgent: pulls every trusted feed concurrently and normalizes items.

This is the "US News Agent" + "Celebrity Intelligence Agent" from the spec,
unified: the feed registry is tagged by section/region/category so one puller
serves both surfaces.
"""

import asyncio
import calendar
import logging
import re

import feedparser
import httpx

from app.config import FEEDS, Feed, credibility_for, settings
from app.models import Story
from app.util import clean, no_dash, truncate

log = logging.getLogger("agent.ingestion")

_HEADERS = {
    "user-agent": "NewsPulseBot/0.1 (+https://newspulse.ai)",
    "accept": "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8",
}


def _published_ms(entry) -> int | None:
    for key in ("published_parsed", "updated_parsed"):
        val = entry.get(key)
        if val:
            try:
                return int(calendar.timegm(val) * 1000)
            except Exception:
                pass
    return None


def _image(entry) -> str | None:
    media = entry.get("media_content") or entry.get("media_thumbnail")
    if media and isinstance(media, list) and media[0].get("url"):
        return media[0]["url"]
    for enc in entry.get("enclosures", []) or []:
        if str(enc.get("type", "")).startswith("image") and enc.get("href"):
            return enc["href"]
        if enc.get("href"):
            return enc["href"]
    return None


_TAG_RE = re.compile(r"<[^>]+>")


def _summary(entry) -> str:
    raw = entry.get("summary") or ""
    # feedparser leaves HTML in summaries; strip tags cheaply.
    text = _TAG_RE.sub(" ", raw)
    return truncate(no_dash(clean(text)))


class IngestionAgent:
    name = "Ingestion"

    def __init__(self) -> None:
        self.status = "idle"
        self.detail = ""

    async def _fetch(self, client: httpx.AsyncClient, feed: Feed) -> list[Story]:
        try:
            resp = await client.get(feed.url, headers=_HEADERS, timeout=settings.fetch_timeout_seconds)
            resp.raise_for_status()
            parsed = await asyncio.to_thread(feedparser.parse, resp.content)
        except Exception as exc:  # slow/broken feed: skip, aggregate the rest
            log.warning("feed failed %s: %s", feed.url, exc)
            return []

        stories: list[Story] = []
        for entry in parsed.entries:
            title = no_dash(clean(entry.get("title", "")))
            link = entry.get("link", "")
            if not title or not link:
                continue
            stories.append(
                Story(
                    category=feed.category,
                    title=title,
                    summary=_summary(entry) or "Summary unavailable. Read the full story at the source.",
                    source=feed.publisher,
                    credibility=credibility_for(feed.publisher),
                    link=link,
                    image=_image(entry),
                    region=feed.region,
                    publishedAt=_published_ms(entry),
                )
            )
        return stories

    async def run(self) -> list[Story]:
        self.status = "running"
        async with httpx.AsyncClient(follow_redirects=True) as client:
            results = await asyncio.gather(*(self._fetch(client, f) for f in FEEDS))
        stories = [s for group in results for s in group]
        live = len({s.source for s in stories})
        self.status = "ok" if stories else "degraded"
        self.detail = f"{len(stories)} items from {live} publishers"
        log.info("ingestion: %s", self.detail)
        return stories
