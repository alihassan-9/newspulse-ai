"""NewsroomOrchestrator: runs the agent pipeline and updates the store.

Pipeline:  Ingestion -> Deduplication -> Verification -> store
On demand:  Extraction (+ optional Journalist) for a single article.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone

from app.agents.extraction import ExtractionAgent
from app.agents.image import ImageAgent
from app.agents.ingestion import IngestionAgent
from app.agents.journalist import JournalistAgent
from app.agents.verification import DuplicateDetectionAgent, VerificationAgent
from app.config import settings
from app.models import AgentStatus, ArticleResponse, NewsEvent, PipelineStatus
from app.store import store

log = logging.getLogger("orchestrator")


class NewsroomOrchestrator:
    def __init__(self) -> None:
        self.ingestion = IngestionAgent()
        self.dedup = DuplicateDetectionAgent()
        self.verification = VerificationAgent()
        self.extraction = ExtractionAgent()
        self.journalist = JournalistAgent()
        self.image = ImageAgent()
        self._running = False
        self._lock = asyncio.Lock()

    async def refresh(self) -> PipelineStatus:
        async with self._lock:  # never run two pipelines at once
            self._running = True
            start = time.perf_counter()
            try:
                stories = await self.ingestion.run()
                unique = self.dedup.run(stories)
                us_stories = [s for s in unique if "Celebrity" not in s.category and s.region == "US"]
                celeb_stories = [s for s in unique if "Celebrity" in s.category]
                us_events = self.verification.run(us_stories)
                celebrity_events = self.verification.run(celeb_stories)
            finally:
                self._running = False

            elapsed_ms = int((time.perf_counter() - start) * 1000)
            verified = sum(1 for e in (*us_events, *celebrity_events) if e.verified)
            live = len({s.source for s in stories})

            status = PipelineStatus(
                running=False,
                last_run_iso=datetime.now(timezone.utc).isoformat(),
                last_run_ms=elapsed_ms,
                refresh_interval_seconds=settings.refresh_interval_seconds,
                total_articles=len(unique),
                us_events=len(us_events),
                celebrity_events=len(celebrity_events),
                verified_events=verified,
                live_publishers=live,
                agents=[
                    AgentStatus(name=self.ingestion.name, status=self.ingestion.status, detail=self.ingestion.detail),
                    AgentStatus(name=self.dedup.name, status=self.dedup.status, detail=self.dedup.detail),
                    AgentStatus(name=self.verification.name, status=self.verification.status, detail=self.verification.detail),
                    AgentStatus(
                        name=self.journalist.name,
                        status="ready" if self.journalist.enabled else "disabled",
                        detail=self.journalist.detail,
                    ),
                    AgentStatus(
                        name=self.image.name,
                        status="ready" if self.image.enabled else "disabled",
                        detail="Nano Banana ready" if self.image.enabled else "set GEMINI_API_KEY to enable",
                    ),
                ],
            )
            store.replace(us_events, celebrity_events, status)
            log.info("refresh done in %sms: %s us / %s celeb", elapsed_ms, len(us_events), len(celebrity_events))
            return status

    async def get_article(self, event: NewsEvent) -> ArticleResponse:
        extracted = await self.extraction.run(event.link) if event.link else {"body": [], "site_name": None, "author": None, "image": None}
        body = extracted["body"] or [event.summary]
        if extracted.get("image") and not event.image:
            event = event.model_copy(update={"image": extracted["image"]})
        # Text brief and Nano Banana post image are independent network calls: run both at once.
        brief, post_image = await asyncio.gather(
            self.journalist.run(event, extracted["body"]),
            self.image.run(event, extracted["body"]),
        )
        return ArticleResponse(
            event=event,
            body=body,
            site_name=extracted["site_name"],
            author=extracted["author"],
            brief=brief,
            post_image=post_image,
        )


orchestrator = NewsroomOrchestrator()
