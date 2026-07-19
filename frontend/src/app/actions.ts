"use server";

import { updateTag } from "next/cache";
import { FEEDS_TAG } from "@/lib/rss";

/**
 * Expire every cached RSS response so the next render pulls genuinely fresh
 * stories. `updateTag` (Server Actions only) expires immediately and makes the
 * next request wait for fresh data, unlike `revalidateTag`, which would serve
 * stale content while refetching in the background.
 */
export async function refreshFeeds(): Promise<void> {
  updateTag(FEEDS_TAG);
}
