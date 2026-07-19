"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsEvent } from "@/lib/verify";
import EventCard from "@/components/EventCard";

type FilterKey = "region" | "category" | "source";

type Props = {
  events: NewsEvent[];
  /** Which field to filter/select on. */
  filterKey: FilterKey;
  /** localStorage key so a user's pick persists. */
  storageKey: string;
  labels?: Record<string, string>;
};

const ALL = "__all__";

/** An event can match several values (a story has many sources), so always a list. */
function valuesFor(e: NewsEvent, key: FilterKey): string[] {
  if (key === "source") return e.sources;
  const v = e[key];
  return v ? [v] : [];
}

export default function EventFilterGrid({ events, filterKey, storageKey, labels }: Props) {
  // Options + live counts, in a stable order.
  const options = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      for (const v of valuesFor(e, filterKey)) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  }, [events, filterKey]);

  // Single-select: ALL (default) or one option value.
  const [selected, setSelected] = useState<string>(ALL);

  useEffect(() => {
    let next = ALL;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && (saved === ALL || options.some((o) => o.value === saved))) next = saved;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(next);
  }, [storageKey, options]);

  function pick(value: string) {
    setSelected(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {}
  }

  const visible = selected === ALL ? events : events.filter((e) => valuesFor(e, filterKey).includes(selected));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FilterPill label="All" count={events.length} active={selected === ALL} onClick={() => pick(ALL)} />
        {options.map((o) => (
          <FilterPill
            key={o.value}
            label={labels?.[o.value] ?? o.value}
            count={o.count}
            active={selected === o.value}
            onClick={() => pick(o.value)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          No stories match this filter right now.
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-violet-600 bg-violet-600 text-white shadow-[var(--shadow-sm)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
          active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
