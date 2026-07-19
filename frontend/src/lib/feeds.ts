// Trusted-source feed configuration for the NewsPulse ingestion layer.
//
// Scope (per product spec): Latest U.S. news + Celebrity/Entertainment across
// US, UK, CA, AU. Every feed here is a public RSS/Atom endpoint from an
// established publisher. Credibility scores are an editorial approximation used
// for the "verified sources" surface — they are per-publisher, not per-story.

export type Section = "us-news" | "celebrity" | "international";
export type Region = "US" | "UK" | "CA" | "AU" | "Global";

export type FeedSource = {
  /** Publisher display name, e.g. "NPR". */
  publisher: string;
  /** RSS/Atom endpoint. */
  url: string;
  /** Which dashboard column the stories feed into. */
  section: Section;
  /** Editorial category label shown on the card. */
  category: string;
  /** Country the coverage is anchored to. */
  region: Region;
};

/** Per-publisher credibility score (0-100), editorial approximation. */
export const PUBLISHER_CREDIBILITY: Record<string, number> = {
  Reuters: 99,
  AP: 99,
  BBC: 97,
  NPR: 96,
  "The Guardian": 95,
  ABC: 95,
  CBC: 95,
  CNBC: 93,
  CNN: 92,
  "Al Jazeera": 90,
  "Global News": 88,
  People: 90,
  Variety: 88,
  "E! Online": 82,
};

/** Credibility as a display string, defaulting conservatively for unknowns. */
export function credibilityFor(publisher: string): string {
  return `${PUBLISHER_CREDIBILITY[publisher] ?? 60}%`;
}

export const FEEDS: FeedSource[] = [
  // --- Latest U.S. News -----------------------------------------------------
  { publisher: "NPR", url: "https://feeds.npr.org/1001/rss.xml", section: "us-news", category: "National", region: "US" },
  { publisher: "NPR", url: "https://feeds.npr.org/1014/rss.xml", section: "us-news", category: "Politics", region: "US" },
  { publisher: "NPR", url: "https://feeds.npr.org/1006/rss.xml", section: "us-news", category: "Business", region: "US" },
  { publisher: "NPR", url: "https://feeds.npr.org/1019/rss.xml", section: "us-news", category: "Technology", region: "US" },
  { publisher: "NPR", url: "https://feeds.npr.org/1007/rss.xml", section: "us-news", category: "Science", region: "US" },
  { publisher: "NPR", url: "https://feeds.npr.org/1128/rss.xml", section: "us-news", category: "Health", region: "US" },
  { publisher: "The Guardian", url: "https://www.theguardian.com/us-news/rss", section: "us-news", category: "National", region: "US" },
  { publisher: "The Guardian", url: "https://www.theguardian.com/us-news/us-politics/rss", section: "us-news", category: "Politics", region: "US" },
  { publisher: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", section: "us-news", category: "Business", region: "US" },
  { publisher: "CNBC", url: "https://www.cnbc.com/id/19854910/device/rss/rss.html", section: "us-news", category: "Technology", region: "US" },
  { publisher: "BBC", url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml", section: "us-news", category: "National", region: "US" },
  { publisher: "BBC", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", section: "us-news", category: "Technology", region: "US" },
  { publisher: "BBC", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", section: "us-news", category: "Science", region: "US" },

  // --- Celebrity & Entertainment -------------------------------------------
  { publisher: "Variety", url: "https://variety.com/feed/", section: "celebrity", category: "US Celebrity", region: "US" },
  { publisher: "E! Online", url: "https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml", section: "celebrity", category: "US Celebrity", region: "US" },
  { publisher: "BBC", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", section: "celebrity", category: "UK Celebrity", region: "UK" },
  { publisher: "The Guardian", url: "https://www.theguardian.com/culture/rss", section: "celebrity", category: "UK Celebrity", region: "UK" },
  // CBC's RSS endpoints are unreachable (DNS/blocked), so Canada rides on Global News.
  { publisher: "Global News", url: "https://globalnews.ca/entertainment/feed/", section: "celebrity", category: "CA Celebrity", region: "CA" },
  { publisher: "ABC", url: "https://www.abc.net.au/news/feed/51892/rss.xml", section: "celebrity", category: "AU Celebrity", region: "AU" },
  { publisher: "ABC", url: "https://www.abc.net.au/news/feed/45924/rss.xml", section: "celebrity", category: "AU Celebrity", region: "AU" },

  // --- International / World ------------------------------------------------
  { publisher: "BBC", url: "https://feeds.bbci.co.uk/news/world/rss.xml", section: "international", category: "World", region: "Global" },
  { publisher: "The Guardian", url: "https://www.theguardian.com/world/rss", section: "international", category: "World", region: "Global" },
  { publisher: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", section: "international", category: "World", region: "Global" },
  { publisher: "NPR", url: "https://feeds.npr.org/1004/rss.xml", section: "international", category: "World", region: "Global" },
  { publisher: "Global News", url: "https://globalnews.ca/world/feed/", section: "international", category: "World", region: "Global" },
];
