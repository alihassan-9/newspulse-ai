import { getAllEvents } from "@/lib/news-service";
import EventFilterGrid from "@/components/EventFilterGrid";

export const metadata = { title: "US News · NewsPulse AI" };
export const dynamic = "force-dynamic";

export default async function UsNewsPage() {
  const { usEvents } = await getAllEvents();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-7 border-b border-slate-200 pb-5">
        <p className="eyebrow text-violet-600">United States</p>
        <h1 className="font-display font-display-tight mt-1.5 text-[34px] leading-tight text-slate-900">US News</h1>
        <p className="mt-2 text-sm text-slate-400">
          Latest verified US stories. Choose the sections you follow: Politics, Business, Technology, Science, Health &amp; more.
        </p>
      </div>

      {usEvents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No US stories available right now. Feeds may be temporarily unreachable.
        </p>
      ) : (
        <EventFilterGrid events={usEvents} filterKey="category" storageKey="np:us-categories" />
      )}
    </div>
  );
}
