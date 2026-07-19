import Link from "next/link";
import { getAllEvents } from "@/lib/news-service";
import EventCard from "@/components/EventCard";
import type { NewsEvent } from "@/lib/verify";

export const metadata = { title: "Search · NewsPulse AI" };
export const dynamic = "force-dynamic";

function matches(e: NewsEvent, q: string): boolean {
  const hay = [e.title, e.summary, e.category, e.region, ...e.sources].join(" ").toLowerCase();
  return q.split(/\s+/).every((term) => hay.includes(term));
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const { usEvents, celebrityEvents } = await getAllEvents();
  const all = [...usEvents, ...celebrityEvents];
  const results = query ? all.filter((e) => matches(e, query)) : [];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-7 border-b border-slate-200 pb-5">
        <p className="eyebrow text-violet-600">Search</p>
        <h1 className="font-display font-display-tight mt-1.5 text-[34px] leading-tight text-slate-900">
          {query ? <>Results for “{q.trim()}”</> : "Search stories"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {query
            ? `${results.length} ${results.length === 1 ? "story" : "stories"} match your search.`
            : "Type in the search bar above to find stories by headline, topic, region, or publisher."}
        </p>
      </div>

      {query && results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">No stories match “{q.trim()}”.</p>
          <Link href="/" className="mt-3 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-700">
            Back to Home ›
          </Link>
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
