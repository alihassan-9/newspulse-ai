"""In-memory store of the latest newsroom snapshot (single-user tool)."""

import threading

from app.models import NewsEvent, PipelineStatus


class NewsStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.us: list[NewsEvent] = []
        self.celebrity: list[NewsEvent] = []
        self.status: PipelineStatus | None = None

    def replace(self, us: list[NewsEvent], celebrity: list[NewsEvent], status: PipelineStatus) -> None:
        with self._lock:
            self.us = us
            self.celebrity = celebrity
            self.status = status

    def by_id(self, event_id: str) -> NewsEvent | None:
        for e in (*self.us, *self.celebrity):
            if e.id == event_id:
                return e
        return None


store = NewsStore()
