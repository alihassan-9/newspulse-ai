import { getAllEvents } from "@/lib/news-service";
import EventFilterGrid from "@/components/EventFilterGrid";

export const metadata = { title: "Celebrity News · NewsPulse AI" };
export const dynamic = "force-dynamic";

const REGION_LABELS = {
  US: "🇺🇸 United States",
  UK: "🇬🇧 United Kingdom",
  CA: "🇨🇦 Canada",
  AU: "🇦🇺 Australia",
};

export default async function CelebrityPage() {
  const { celebrityEvents } = await getAllEvents();

  // Keep every region represented: take the newest N per region rather than the
  // newest 20 overall, which used to drop CA/AU off the page (and out of the
  // filter options) whenever US/UK stories were fresher.
  const PER_REGION = 8;
  const byRegion = new Map<string, typeof celebrityEvents>();
  for (const e of celebrityEvents) {
    const region = e.region ?? "Other";
    const list = byRegion.get(region) ?? [];
    if (list.length < PER_REGION) list.push(e);
    byRegion.set(region, list);
  }
  const top20 = [...byRegion.values()].flat();

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <div className="mb-7 border-b border-slate-200 pb-5">
        <p className="eyebrow text-violet-600">Entertainment</p>
        <h1 className="font-display font-display-tight mt-1.5 text-[34px] leading-tight text-slate-900">Celebrity News</h1>
        <p className="mt-2 text-sm text-slate-400">
          {top20.length} entertainment stories across the US, UK, Canada &amp; Australia. Filter by country.
        </p>
      </div>

      {top20.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No celebrity stories available right now. Feeds may be temporarily unreachable.
        </p>
      ) : (
        <EventFilterGrid
          events={top20}
          filterKey="region"
          storageKey="np:celebrity-regions"
          labels={REGION_LABELS}
        />
      )}
    </div>
  );
}
