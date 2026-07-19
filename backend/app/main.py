"""FastAPI application: exposes the newsroom to the Next.js frontend."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import ArticleResponse, EventsResponse, PipelineStatus
from app.orchestrator import orchestrator
from app.scheduler import run_forever
from app.store import store

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

_EMPTY_STATUS = PipelineStatus(
    running=False, last_run_iso=None, last_run_ms=None,
    refresh_interval_seconds=settings.refresh_interval_seconds,
    total_articles=0, us_events=0, celebrity_events=0, verified_events=0,
    live_publishers=0, agents=[],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(run_forever())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="NewsPulse AI Backend", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "ready": store.status is not None}


@app.get("/api/status", response_model=PipelineStatus)
async def status() -> PipelineStatus:
    return store.status or _EMPTY_STATUS


@app.get("/api/events", response_model=EventsResponse)
async def events() -> EventsResponse:
    return EventsResponse(us=store.us, celebrity=store.celebrity, status=store.status or _EMPTY_STATUS)


@app.get("/api/us")
async def us_news(categories: str | None = None):
    items = store.us
    if categories:
        wanted = {c.strip() for c in categories.split(",") if c.strip()}
        items = [e for e in items if e.category in wanted]
    return {"events": items}


@app.get("/api/celebrity")
async def celebrity(limit: int = 20):
    return {"events": store.celebrity[:limit]}


@app.get("/api/article/{event_id}", response_model=ArticleResponse)
async def article(event_id: str) -> ArticleResponse:
    event = store.by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return await orchestrator.get_article(event)


@app.post("/api/refresh", response_model=PipelineStatus)
async def refresh() -> PipelineStatus:
    return await orchestrator.refresh()
