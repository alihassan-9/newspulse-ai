"""Background scheduler: keeps the newsroom fresh in near real time."""

import asyncio
import logging

from app.config import settings
from app.orchestrator import orchestrator

log = logging.getLogger("scheduler")


async def run_forever() -> None:
    """Refresh immediately, then every REFRESH_INTERVAL seconds."""
    while True:
        try:
            await orchestrator.refresh()
        except Exception:  # never let the loop die
            log.exception("refresh cycle failed")
        await asyncio.sleep(settings.refresh_interval_seconds)
