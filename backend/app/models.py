"""Pydantic models. Field names mirror the frontend NewsEvent/Story shapes."""

from pydantic import BaseModel


class Story(BaseModel):
    category: str
    title: str
    summary: str
    source: str
    credibility: int
    link: str
    image: str | None = None
    region: str
    publishedAt: int | None = None  # epoch ms


class NewsEvent(BaseModel):
    id: str
    title: str
    summary: str
    category: str
    region: str
    link: str | None = None
    image: str | None = None
    publishedAt: int | None = None
    sources: list[str]
    sourceCount: int
    verified: bool
    verificationLabel: str
    maxCredibility: int
    stories: list[Story]


class AgentStatus(BaseModel):
    name: str
    status: str
    detail: str = ""


class PipelineStatus(BaseModel):
    running: bool
    last_run_iso: str | None
    last_run_ms: int | None
    refresh_interval_seconds: int
    total_articles: int
    us_events: int
    celebrity_events: int
    verified_events: int
    live_publishers: int
    agents: list[AgentStatus]


class EventsResponse(BaseModel):
    us: list[NewsEvent]
    celebrity: list[NewsEvent]
    status: PipelineStatus


class ArticleResponse(BaseModel):
    event: NewsEvent
    body: list[str]
    site_name: str | None = None
    author: str | None = None
    brief: dict | None = None  # optional AI research brief
    post_image: str | None = None  # optional AI post image (Nano Banana), data URI
