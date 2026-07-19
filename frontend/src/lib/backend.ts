// Client for the FastAPI backend. When BACKEND_URL is set, the Next.js app
// reads live data from the Python newsroom instead of ingesting locally.
// Maps the backend JSON into the frontend's Story / NewsEvent types.

import type { Story, NewsletterData } from "@/lib/news-data";
import type { NewsEvent } from "@/lib/verify";
import type { Article } from "@/lib/extract";
import type { EventBundle } from "@/lib/news-service";

type BackendStory = {
  category: string;
  title: string;
  summary: string;
  source: string;
  credibility: number;
  link: string;
  image: string | null;
  region: string;
  publishedAt: number | null;
};

type BackendEvent = Omit<NewsEvent, "stories" | "credibility"> & { stories: BackendStory[] };

function mapStory(s: BackendStory): Story {
  return {
    category: s.category,
    title: s.title,
    summary: s.summary,
    source: s.source,
    credibility: `${s.credibility}%`,
    link: s.link,
    image: s.image,
    region: s.region,
    publishedAt: s.publishedAt,
  };
}

function mapEvent(e: BackendEvent): NewsEvent {
  return { ...e, stories: e.stories.map(mapStory) } as NewsEvent;
}

async function get(base: string, path: string) {
  const res = await fetch(`${base}${path}`, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`backend ${path} -> ${res.status}`);
  return res.json();
}

export async function fetchEventsFromBackend(base: string): Promise<EventBundle> {
  const data = await get(base, "/api/events");
  return {
    usEvents: (data.us as BackendEvent[]).map(mapEvent),
    celebrityEvents: (data.celebrity as BackendEvent[]).map(mapEvent),
    // The Python backend does not expose an international section yet.
    internationalEvents: ((data.international ?? []) as BackendEvent[]).map(mapEvent),
    livePublishers: data.status?.live_publishers ?? 0,
    totalArticles: data.status?.total_articles ?? 0,
  };
}

export async function fetchArticleFromBackend(
  base: string,
  id: string,
): Promise<{ event: NewsEvent; article: Article | null } | null> {
  try {
    const data = await get(base, `/api/article/${id}`);
    const event = mapEvent(data.event as BackendEvent);
    const article: Article = {
      image: data.event.image ?? null,
      siteName: data.site_name ?? null,
      author: data.author ?? null,
      paragraphs: data.body ?? [],
      text: (data.body ?? []).join("\n\n"),
      postImage: data.post_image ?? null,
    };
    return { event, article };
  } catch {
    return null;
  }
}

/** Pipeline status for the dashboard (agent health). Null if backend is off. */
export async function fetchStatusFromBackend(base: string): Promise<NewsletterData["pipeline"] | null> {
  try {
    const s = await get(base, "/api/status");
    return (s.agents ?? []).map((a: { name: string; status: string }) => ({
      step: a.name,
      status: a.status,
    }));
  } catch {
    return null;
  }
}
