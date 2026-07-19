"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshFeeds } from "@/app/actions";

/**
 * Polls for new stories on a fixed cadence (default 5 minutes).
 *
 * `router.refresh()` alone would not help: it clears the client cache but not
 * the server-side fetch cache, so it can re-render the very same stories. The
 * server action expires the `feeds` tag first, then the refresh re-renders the
 * Server Components against fresh data.
 */
export default function AutoRefresh({ intervalMs = 5 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const lastRun = useRef(0);

  useEffect(() => {
    let cancelled = false;
    lastRun.current = Date.now();

    async function tick() {
      // Don't burn requests on a tab nobody is looking at.
      if (cancelled || document.hidden) return;
      lastRun.current = Date.now();
      setBusy(true);
      try {
        await refreshFeeds();
        router.refresh();
      } catch {
        // Offline or the action failed — try again on the next tick.
      } finally {
        if (!cancelled) setTimeout(() => setBusy(false), 1200);
      }
    }

    const id = setInterval(tick, intervalMs);

    // If the tab was hidden through one or more ticks, catch up on return —
    // but only when the interval has genuinely elapsed, so simply switching
    // tabs never triggers a refetch.
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastRun.current >= intervalMs) void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);

  if (!busy) return null;
  return (
    <div className="animate-fade-up pointer-events-none fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-lg)] backdrop-blur">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      Checking for new stories…
    </div>
  );
}
