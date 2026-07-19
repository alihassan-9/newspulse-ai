"""Runtime settings and the trusted-source feed registry."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    refresh_interval_seconds: int = int(os.getenv("REFRESH_INTERVAL", "300"))  # 5 min
    fetch_timeout_seconds: float = float(os.getenv("FETCH_TIMEOUT", "8"))
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or None
    # LLM brain for the AI Journalist: "ollama" (local, free) or "gemini" (cloud).
    llm_provider: str = (os.getenv("LLM_PROVIDER") or "gemini").lower()
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    cors_origins: tuple[str, ...] = tuple(
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()
    )


settings = Settings()


# Per-publisher credibility (editorial approximation, 0-100).
PUBLISHER_CREDIBILITY: dict[str, int] = {
    "Reuters": 99,
    "AP": 99,
    "BBC": 97,
    "NPR": 96,
    "The Guardian": 95,
    "ABC": 95,
    "CBC": 95,
    "CNBC": 93,
    "CNN": 92,
    "Global News": 88,
    "People": 90,
    "Variety": 88,
    "E! Online": 82,
}


def credibility_for(publisher: str) -> int:
    return PUBLISHER_CREDIBILITY.get(publisher, 60)


@dataclass(frozen=True)
class Feed:
    publisher: str
    url: str
    section: str  # "us-news" | "celebrity"
    category: str
    region: str  # US | UK | CA | AU


FEEDS: list[Feed] = [
    # Latest U.S. News
    Feed("NPR", "https://feeds.npr.org/1001/rss.xml", "us-news", "National", "US"),
    Feed("NPR", "https://feeds.npr.org/1014/rss.xml", "us-news", "Politics", "US"),
    Feed("NPR", "https://feeds.npr.org/1006/rss.xml", "us-news", "Business", "US"),
    Feed("NPR", "https://feeds.npr.org/1019/rss.xml", "us-news", "Technology", "US"),
    Feed("NPR", "https://feeds.npr.org/1007/rss.xml", "us-news", "Science", "US"),
    Feed("NPR", "https://feeds.npr.org/1128/rss.xml", "us-news", "Health", "US"),
    Feed("The Guardian", "https://www.theguardian.com/us-news/rss", "us-news", "National", "US"),
    Feed("The Guardian", "https://www.theguardian.com/us-news/us-politics/rss", "us-news", "Politics", "US"),
    Feed("CNBC", "https://www.cnbc.com/id/100003114/device/rss/rss.html", "us-news", "Business", "US"),
    Feed("CNBC", "https://www.cnbc.com/id/19854910/device/rss/rss.html", "us-news", "Technology", "US"),
    Feed("BBC", "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml", "us-news", "National", "US"),
    Feed("BBC", "https://feeds.bbci.co.uk/news/technology/rss.xml", "us-news", "Technology", "US"),
    Feed("BBC", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "us-news", "Science", "US"),
    # Celebrity & Entertainment
    Feed("Variety", "https://variety.com/feed/", "celebrity", "US Celebrity", "US"),
    Feed("E! Online", "https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml", "celebrity", "US Celebrity", "US"),
    Feed("BBC", "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "celebrity", "UK Celebrity", "UK"),
    Feed("The Guardian", "https://www.theguardian.com/culture/rss", "celebrity", "UK Celebrity", "UK"),
    # CBC's RSS endpoints are unreachable (DNS/blocked), so Canada rides on Global News.
    Feed("Global News", "https://globalnews.ca/entertainment/feed/", "celebrity", "CA Celebrity", "CA"),
    Feed("ABC", "https://www.abc.net.au/news/feed/51892/rss.xml", "celebrity", "AU Celebrity", "AU"),
    Feed("ABC", "https://www.abc.net.au/news/feed/45924/rss.xml", "celebrity", "AU Celebrity", "AU"),
]
