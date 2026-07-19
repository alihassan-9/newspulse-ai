"""ExtractionAgent: fetches an article page and pulls the main body text.

Used on-demand by the article endpoint so the reader sees real content and a
hero image rather than the thin RSS blurb. Best-effort; returns empty body on
failure and the caller falls back to the event summary.
"""

import logging

import httpx
from bs4 import BeautifulSoup

from app.config import settings
from app.util import clean, no_dash

log = logging.getLogger("agent.extraction")

_HEADERS = {
    "user-agent": "Mozilla/5.0 (compatible; NewsPulseBot/0.1; +https://newspulse.ai)",
    "accept": "text/html,application/xhtml+xml",
}


class ExtractionAgent:
    name = "Extraction"

    async def run(self, url: str) -> dict:
        empty = {"body": [], "site_name": None, "author": None, "image": None}
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url, headers=_HEADERS, timeout=9.0)
                resp.raise_for_status()
                html = resp.text
        except Exception as exc:
            log.warning("extract failed %s: %s", url, exc)
            return empty

        soup = BeautifulSoup(html, "html.parser")

        def meta(*names: str) -> str | None:
            for n in names:
                tag = soup.find("meta", attrs={"property": n}) or soup.find("meta", attrs={"name": n})
                if tag and tag.get("content"):
                    return tag["content"].strip()
            return None

        image = meta("og:image", "twitter:image")
        site_name = meta("og:site_name")
        author = meta("author", "article:author")

        for junk in soup(["script", "style", "noscript", "nav", "header", "footer", "aside", "form", "figure", "iframe"]):
            junk.decompose()

        scope = soup.find("article") or soup.find("main") or soup.body or soup
        seen: set[str] = set()
        body: list[str] = []
        for p in scope.find_all("p"):
            text = no_dash(clean(p.get_text(" ")))
            if len(text) >= 60 and text not in seen:
                seen.add(text)
                body.append(text)
            if len(body) >= 30:
                break

        return {"body": body, "site_name": site_name, "author": author, "image": image}
