import { getAllEvents } from "@/lib/news-service";
import EventFilterGrid from "@/components/EventFilterGrid";

export const metadata = { title: "International · NewsPulse AI" };
export const dynamic = "force-dynamic";

export default async function InternationalPage() {
  const { internationalEvents } = await getAllEvents();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-7 border-b border-slate-200 pb-5">
        <p className="eyebrow text-violet-600">Around the world</p>
        <h1 className="font-display font-display-tight mt-1.5 text-[34px] leading-tight text-slate-900">
          International News
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          The latest world coverage, cross-checked across BBC, The Guardian, Al Jazeera, NPR &amp; Global News. Filter by publisher.
        </p>
      </div>

      {internationalEvents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No international stories available right now. Feeds may be temporarily unreachable.
        </p>
      ) : (
        <EventFilterGrid
          events={internationalEvents}
          filterKey="source"
          storageKey="np:international-source"
        />
      )}
    </div>
  );
}
