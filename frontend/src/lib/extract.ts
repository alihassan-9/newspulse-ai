// Full-article extraction: fetch the publisher page and pull the main content.
//
// Used by the article detail page to show real body text + hero image rather
// than the thin RSS blurb. Best-effort and resilient — returns null on failure
// and the caller falls back to the RSS summary.

import * as cheerio from "cheerio";
import { noDash } from "@/lib/format";

export type Article = {
  image: string | null;
  siteName: string | null;
  author: string | null;
  paragraphs: string[];
  text: string;
  postImage?: string | null; // Nano Banana post art (from the backend), data URI
};

export async function extractArticle(
  url: string,
  revalidateSeconds = 1800,
): Promise<Article | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; NewsPulseBot/0.1; +https://newspulse.ai)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(9000),
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const meta = (sel: string, attr = "content") =>
      $(sel).first().attr(attr)?.trim() || null;

    const image =
      meta('meta[property="og:image"]') ||
      meta('meta[name="twitter:image"]') ||
      meta('meta[itemprop="image"]');
    const siteName = meta('meta[property="og:site_name"]');
    const author =
      meta('meta[name="author"]') || meta('meta[property="article:author"]');

    // Strip chrome/noise before reading paragraphs.
    $("script, style, noscript, nav, header, footer, aside, form, figure, iframe").remove();

    let $scope = $("article").first();
    if (!$scope.length) $scope = $("main").first();
    if (!$scope.length) $scope = $("body");

    const seen = new Set<string>();
    const paragraphs: string[] = [];
    $scope.find("p").each((_, el) => {
      const t = noDash($(el).text().replace(/\s+/g, " ").trim());
      if (t.length >= 60 && !seen.has(t)) {
        seen.add(t);
        paragraphs.push(t);
      }
    });

    const trimmed = paragraphs.slice(0, 30);
    return { image, siteName, author, paragraphs: trimmed, text: trimmed.join("\n\n") };
  } catch {
    return null;
  }
}
