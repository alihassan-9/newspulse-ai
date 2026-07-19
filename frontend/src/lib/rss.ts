// Minimal, dependency-free RSS 2.0 / Atom parser.
//
// News RSS is well-formed and predictable, so we extract the handful of fields
// we need with scoped regexes rather than pulling in an XML parser. This keeps
// the ingestion layer zero-dependency, matching the project's lightweight goal.

import type { FeedSource } from "@/lib/feeds";

export type RawItem = {
  title: string;
  link: string;
  summary: string;
  image: string | null;
  publishedAt: number | null; // epoch ms, or null if unparseable
  source: FeedSource;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

function stripCdata(input: string): string {
  return input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

/** Extract the inner text of the first `<tag>...</tag>` in a block. */
function firstTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1] : null;
}

/** Read an attribute value off the first matching self-closing/opening tag. */
function tagAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = block.match(re);
  return m ? m[1] : null;
}

function cleanText(raw: string | null): string {
  if (!raw) return "";
  const withoutCdata = stripCdata(raw);
  const withoutTags = withoutCdata.replace(/<[^>]+>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function truncate(text: string, max = 220): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

function extractLink(block: string): string {
  // RSS: <link>URL</link>. Atom: <link href="URL" rel="alternate"/>.
  const rssLink = firstTag(block, "link");
  if (rssLink && rssLink.trim()) return decodeEntities(stripCdata(rssLink).trim());
  const atomAlt = block.match(/<link\b[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i);
  if (atomAlt) return decodeEntities(atomAlt[1]);
  const anyHref = tagAttr(block, "link", "href");
  return anyHref ? decodeEntities(anyHref) : "";
}

function extractImage(block: string): string | null {
  const url =
    tagAttr(block, "media:content", "url") ||
    tagAttr(block, "media:thumbnail", "url") ||
    tagAttr(block, "enclosure", "url");
  if (url) return decodeEntities(url);
  const inline = block.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return inline ? decodeEntities(inline[1]) : null;
}

function extractDate(block: string): number | null {
  const raw =
    firstTag(block, "pubDate") ||
    firstTag(block, "published") ||
    firstTag(block, "updated") ||
    firstTag(block, "dc:date");
  if (!raw) return null;
  const ts = Date.parse(stripCdata(raw).trim());
  return Number.isNaN(ts) ? null : ts;
}

/** Parse the body of an RSS/Atom document into raw items. */
export function parseFeed(xml: string, source: FeedSource): RawItem[] {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  const items: RawItem[] = [];
  for (const block of blocks) {
    const title = cleanText(firstTag(block, "title"));
    const link = extractLink(block);
    if (!title || !link) continue;
    const summarySource =
      firstTag(block, "description") ||
      firstTag(block, "summary") ||
      firstTag(block, "content:encoded") ||
      firstTag(block, "content");
    items.push({
      title,
      link,
      summary: truncate(cleanText(summarySource)),
      image: extractImage(block),
      publishedAt: extractDate(block),
      source,
    });
  }
  return items;
}

/** Cache tag for every feed request, so the 5-minute auto-refresh can expire them all at once. */
export const FEEDS_TAG = "feeds";

/**
 * Fetch and parse a single feed. Cached via Next's ISR (`revalidate`), and
 * hard-bounded by a timeout so one slow publisher can't stall the render.
 * Returns [] on any failure — the caller aggregates across sources.
 *
 * The window matches the 5-minute refresh cadence; `AutoRefresh` also expires
 * the `feeds` tag on each tick so a refresh always pulls genuinely new stories.
 */
export async function fetchFeed(source: FeedSource, revalidateSeconds = 300): Promise<RawItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "user-agent": "NewsPulseBot/0.1 (+https://newspulse.ai)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: revalidateSeconds, tags: [FEEDS_TAG] },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, source);
  } catch {
    return [];
  }
}
