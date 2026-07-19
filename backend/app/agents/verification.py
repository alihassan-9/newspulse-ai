"""DuplicateDetection + SourceVerification agents.

Clusters overlapping coverage into events by headline-entity overlap, then
labels each event by how many independent trusted publishers carry it. This is
the "confirmed by multiple sources" guarantee, dependency-free.
"""

import logging

from app.config import credibility_for
from app.models import NewsEvent, Story
from app.util import hash_id

log = logging.getLogger("agent.verification")

_STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "have", "has", "will",
    "after", "over", "into", "amid", "says", "say", "new", "how", "why", "what",
    "who", "was", "were", "are", "his", "her", "its", "their", "they", "you",
    "your", "our", "out", "off", "not", "but", "all", "can", "may", "more",
    "than", "then", "them", "been", "being", "about", "against", "would",
    "could", "should", "first", "last", "year", "years", "day", "days", "week",
    "ahead", "while", "when", "where", "which", "there", "here",
}


def _tokens(title: str) -> set[str]:
    words = "".join(c.lower() if c.isalnum() else " " for c in title).split()
    return {w for w in words if len(w) >= 4 and w not in _STOPWORDS}


def _same_event(a: set[str], b: set[str]) -> bool:
    shared = len(a & b)
    if shared < 2:
        return False
    return shared / min(len(a), len(b)) >= 0.5


class DuplicateDetectionAgent:
    name = "Deduplication"

    def __init__(self) -> None:
        self.status = "idle"
        self.detail = ""

    def run(self, stories: list[Story]) -> list[Story]:
        seen: set[str] = set()
        out: list[Story] = []
        for s in stories:
            key = "".join(c for c in s.title.lower() if c.isalnum() or c == " ").strip()
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(s)
        self.status = "ok"
        self.detail = f"{len(stories) - len(out)} duplicates removed"
        return out


class VerificationAgent:
    name = "Verification"

    def __init__(self) -> None:
        self.status = "idle"
        self.detail = ""

    def run(self, stories: list[Story]) -> list[NewsEvent]:
        ordered = sorted(
            stories,
            key=lambda s: (credibility_for(s.source), s.publishedAt or 0),
            reverse=True,
        )
        clusters: list[dict] = []
        for story in ordered:
            toks = _tokens(story.title)
            match = None
            if toks:
                for c in clusters:
                    if c["seed"] and _same_event(c["seed"], toks):
                        match = c
                        break
            if match:
                match["stories"].append(story)
            else:
                clusters.append({"seed": toks, "stories": [story]})

        events = [self._to_event(c["stories"]) for c in clusters]
        events.sort(key=lambda e: (e.verified, e.sourceCount, e.publishedAt or 0), reverse=True)
        verified = sum(1 for e in events if e.verified)
        self.status = "ok"
        self.detail = f"{len(events)} events, {verified} verified"
        return events

    @staticmethod
    def _to_event(cluster: list[Story]) -> NewsEvent:
        lead = cluster[0]
        sources = sorted({s.source for s in cluster}, key=credibility_for, reverse=True)
        count = len(sources)
        verified = count >= 2
        published = max((s.publishedAt for s in cluster if s.publishedAt), default=None)
        image = next((s.image for s in cluster if s.image), None)
        return NewsEvent(
            id=hash_id(lead.link or lead.title),
            title=lead.title,
            summary=lead.summary,
            category=lead.category,
            region=lead.region,
            link=lead.link,
            image=image,
            publishedAt=published,
            sources=sources,
            sourceCount=count,
            verified=verified,
            verificationLabel=f"Verified · {count} sources" if verified else "Single source",
            maxCredibility=max(credibility_for(s.source) for s in cluster),
            stories=cluster,
        )
