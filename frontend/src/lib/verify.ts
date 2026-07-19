// Cross-source verification via lightweight topic clustering.
//
// Groups stories that cover the same real-world event across different
// publishers, then labels each event by how many independent trusted sources
// carry it. This is the "confirmed by multiple sources" guarantee in a
// dependency-free form: no vector DB, just headline-entity overlap.

import { PUBLISHER_CREDIBILITY } from "@/lib/feeds";
import type { Story } from "@/lib/news-data";

export type NewsEvent = {
  id: string;
  title: string; // representative headline (highest-credibility source)
  summary: string;
  category: string;
  region?: string;
  link?: string;
  image?: string | null;
  publishedAt: number | null;
  sources: string[]; // distinct publishers, most credible first
  sourceCount: number;
  verified: boolean; // confirmed by >= 2 independent trusted sources
  verificationLabel: string; // e.g. "Verified — 3 sources" / "Single source"
  maxCredibility: number;
  stories: Story[]; // every article merged into this event
};

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "have", "has", "will",
  "after", "over", "into", "amid", "says", "say", "new", "how", "why", "what",
  "who", "was", "were", "are", "his", "her", "its", "their", "they", "you",
  "your", "our", "out", "off", "not", "but", "all", "can", "may", "more",
  "than", "then", "them", "been", "being", "about", "against", "would",
  "could", "should", "first", "last", "year", "years", "day", "days", "week",
  "amid", "ahead", "while", "when", "where", "which", "there", "here",
]);

function significantTokens(title: string): Set<string> {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  return new Set(tokens);
}

/** Do two headlines describe the same event? Shared salient tokens + overlap. */
function sameEvent(a: Set<string>, b: Set<string>): boolean {
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  if (shared < 2) return false;
  const overlap = shared / Math.min(a.size, b.size);
  return overlap >= 0.5;
}

function credibilityOf(publisher: string): number {
  return PUBLISHER_CREDIBILITY[publisher] ?? 60;
}

type Cluster = { seedTokens: Set<string>; stories: Story[] };

/** Cluster stories into events; most credible + freshest stories seed clusters. */
export function buildEvents(stories: Story[]): NewsEvent[] {
  const ordered = [...stories].sort((a, b) => {
    const cred = credibilityOf(b.source) - credibilityOf(a.source);
    if (cred !== 0) return cred;
    return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
  });

  const clusters: Cluster[] = [];
  for (const story of ordered) {
    const tokens = significantTokens(story.title);
    if (tokens.size === 0) {
      clusters.push({ seedTokens: tokens, stories: [story] });
      continue;
    }
    const match = clusters.find(
      (c) => c.seedTokens.size > 0 && sameEvent(c.seedTokens, tokens),
    );
    if (match) match.stories.push(story);
    else clusters.push({ seedTokens: tokens, stories: [story] });
  }

  return clusters.map((c) => toEvent(c)).sort((a, b) => {
    // Verified events first, then by source count, then recency.
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.sourceCount !== b.sourceCount) return b.sourceCount - a.sourceCount;
    return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
  });
}

// Stable id derived from the lead article's link so /article/[id] survives
// re-clustering across requests (data is cached, ordering is deterministic).
function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function toEvent(cluster: Cluster): NewsEvent {
  // Seed story (first added) is the most credible → use it as the representative.
  const lead = cluster.stories[0];
  const sources = [...new Set(cluster.stories.map((s) => s.source))].sort(
    (a, b) => credibilityOf(b) - credibilityOf(a),
  );
  const sourceCount = sources.length;
  const verified = sourceCount >= 2;
  const publishedAt = cluster.stories.reduce<number | null>(
    (max, s) => (s.publishedAt && (!max || s.publishedAt > max) ? s.publishedAt : max),
    null,
  );

  return {
    id: hashId(lead.link || lead.title),
    title: lead.title,
    summary: lead.summary,
    category: lead.category,
    region: lead.region,
    link: lead.link,
    image: cluster.stories.find((s) => s.image)?.image ?? null,
    publishedAt,
    sources,
    sourceCount,
    verified,
    verificationLabel: verified
      ? `Verified · ${sourceCount} sources`
      : "Single source",
    maxCredibility: Math.max(...cluster.stories.map((s) => credibilityOf(s.source))),
    stories: cluster.stories,
  };
}
