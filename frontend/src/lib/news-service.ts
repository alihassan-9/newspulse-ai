// Aggregates live RSS ingestion into the shape the dashboard renders.
//
// Fetches every trusted feed in parallel, normalizes items into `Story`s,
// dedupes overlapping coverage, and assembles the newsroom overview. If every
// feed fails (e.g. no network), it falls back to the static mock so the page
// still renders.

import { cache } from "react";
import { credibilityFor, FEEDS, type FeedSource } from "@/lib/feeds";
import { fetchFeed, type RawItem } from "@/lib/rss";
import { newsroomOverview, type NewsletterData, type Story } from "@/lib/news-data";
import { buildEvents, type NewsEvent } from "@/lib/verify";
import { extractArticle, type Article } from "@/lib/extract";
import { noDash } from "@/lib/format";
import { fetchEventsFromBackend, fetchArticleFromBackend } from "@/lib/backend";

export type EventBundle = {
  usEvents: NewsEvent[];
  celebrityEvents: NewsEvent[];
  internationalEvents: NewsEvent[];
  livePublishers: number;
  totalArticles: number;
};

function normalizeKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Remove near-duplicate stories by normalized title; first (freshest) wins. */
function dedupe(stories: Story[]): Story[] {
  const seen = new Set<string>();
  const out: Story[] = [];
  for (const story of stories) {
    const key = normalizeKey(story.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(story);
  }
  return out;
}

function byNewest(a: Story, b: Story): number {
  return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
}

function toStory(item: RawItem): Story {
  return {
    category: item.source.category,
    title: noDash(item.title),
    summary: item.summary ? noDash(item.summary) : "Summary unavailable. Read the full story at the source.",
    source: item.source.publisher,
    credibility: credibilityFor(item.source.publisher),
    link: item.link,
    image: item.image,
    region: item.source.region,
    publishedAt: item.publishedAt,
  };
}

function formatNow(): string {
  return new Date().toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Fetch every feed, cluster into verified events. Wrapped in React `cache` so
 * multiple components in one request (dashboard, sidebar, article page) share a
 * single ingestion pass. Feed HTTP itself is cached by Next ISR (`revalidate`).
 */
export const getAllEvents = cache(async (): Promise<EventBundle> => {
  // Prefer the FastAPI backend when configured; fall back to local ingestion.
  const backend = process.env.BACKEND_URL;
  if (backend) {
    try {
      const bundle = await fetchEventsFromBackend(backend);
      if (bundle.totalArticles > 0) {
        // The Python backend has no international section, so fill it from the
        // frontend's own world feeds instead of leaving the page empty.
        if (bundle.internationalEvents.length === 0) {
          bundle.internationalEvents = await ingestSection("international", isInternational);
        }
        return bundle;
      }
    } catch {
      // backend unreachable — fall through to built-in ingestion
    }
  }

  const results = await Promise.all(FEEDS.map((feed) => fetchFeed(feed)));
  const items = results.flat();
  if (items.length === 0) {
    return { usEvents: [], celebrityEvents: [], internationalEvents: [], livePublishers: 0, totalArticles: 0 };
  }
  const all = dedupe(items.map(toStory)).sort(byNewest);
  const usEvents = buildEvents(all.filter((s) => s.region === "US" && isUsNews(s)));
  const celebrityEvents = buildEvents(all.filter((s) => isCelebrity(s)));
  const internationalEvents = buildEvents(all.filter((s) => isInternational(s)));
  return {
    usEvents,
    celebrityEvents,
    internationalEvents,
    livePublishers: new Set(items.map((i) => i.source.publisher)).size,
    totalArticles: all.length,
  };
});

/** Ingest a single feed section locally (used to supplement the backend). */
async function ingestSection(section: FeedSource["section"], keep: (s: Story) => boolean): Promise<NewsEvent[]> {
  const feeds = FEEDS.filter((f) => f.section === section);
  const items = (await Promise.all(feeds.map((f) => fetchFeed(f)))).flat();
  if (items.length === 0) return [];
  const all = dedupe(items.map(toStory)).sort(byNewest);
  return buildEvents(all.filter(keep));
}

/** Resolve one event by stable id and extract its full article text. */
export async function getEventById(
  id: string,
): Promise<{ event: NewsEvent; article: Article | null } | null> {
  const backend = process.env.BACKEND_URL;
  if (backend) {
    const fromBackend = await fetchArticleFromBackend(backend, id);
    if (fromBackend) return fromBackend;
  }

  const { usEvents, celebrityEvents, internationalEvents } = await getAllEvents();
  const event = [...usEvents, ...celebrityEvents, ...internationalEvents].find((e) => e.id === id);
  if (!event) return null;
  const article = event.link ? await extractArticle(event.link) : null;
  return { event, article };
}

export async function getNewsletterData(): Promise<NewsletterData> {
  const { usEvents, celebrityEvents, livePublishers, totalArticles } = await getAllEvents();

  // No live data available at all — degrade gracefully to the static mock.
  if (totalArticles === 0) {
    return {
      ...newsroomOverview,
      live: false,
      generatedAt: formatNow(),
      usEvents: newsroomOverview.usStories.map(storyToSingleEvent),
      celebrityEvents: newsroomOverview.celebrityStories.map(storyToSingleEvent),
    };
  }

  const featuredUs = usEvents.slice(0, 6);
  const featuredCeleb = celebrityEvents.slice(0, 6);
  const headlines = usEvents.slice(6, 12).map((e) => e.title);
  const verifiedCount = [...usEvents, ...celebrityEvents].filter((e) => e.verified).length;

  return {
    live: true,
    generatedAt: formatNow(),
    hero: {
      kicker: "Verified • Neutral • Daily Magazine",
      title: "Today's US Intelligence Brief",
      summary: `A live digest from ${livePublishers} trusted publishers. ${totalArticles} articles clustered into ${usEvents.length + celebrityEvents.length} events, ${verifiedCount} confirmed by two or more independent sources.`,
    },
    metrics: [
      { label: "Live publishers", value: `${livePublishers}` },
      { label: "Articles ingested", value: `${totalArticles}` },
      { label: "Verified events", value: `${verifiedCount}` },
      { label: "Last updated", value: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) },
    ],
    usEvents: featuredUs,
    celebrityEvents: featuredCeleb,
    pipeline: [
      { step: "Discovery", status: "Live" },
      { step: "Cross-source verification", status: "Active" },
      { step: "AI research briefs", status: "Planned" },
      { step: "Email delivery", status: "Not configured" },
    ],
    preferences: newsroomOverview.preferences,
    headlines: headlines.length > 0 ? headlines : usEvents.slice(0, 6).map((e) => e.title),
  };
}

// Wrap a single mock story as a one-source event (offline fallback only).
function storyToSingleEvent(story: Story, index: number): NewsEvent {
  return {
    id: `mock-${index}`,
    title: story.title,
    summary: story.summary,
    category: story.category,
    region: story.region,
    link: story.link,
    image: story.image ?? null,
    publishedAt: story.publishedAt ?? null,
    sources: [story.source],
    sourceCount: 1,
    verified: false,
    verificationLabel: "Single source",
    maxCredibility: parseInt(story.credibility, 10) || 60,
    stories: [story],
  };
}

// Stories are routed by their category label, which the feed config assigns:
// celebrity feeds use "* Celebrity", international feeds use "World".
function isCelebrity(story: Story): boolean {
  return story.category.includes("Celebrity");
}

function isInternational(story: Story): boolean {
  return story.category === "World";
}

// A story is "US news" only if it is neither celebrity nor international.
function isUsNews(story: Story): boolean {
  return !isCelebrity(story) && !isInternational(story);
}
