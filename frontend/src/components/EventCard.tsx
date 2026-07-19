import Link from "next/link";
import type { NewsEvent } from "@/lib/verify";
import { timeAgo } from "@/lib/format";
import { categoryColor } from "@/lib/categories";

// Deterministic branded placeholder so image-less stories never render as blank boxes.
function initials(text: string) {
  const words = text.replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("") || "NP";
}

export default function EventCard({ event }: { event: NewsEvent }) {
  const source = event.sources[0] ?? "Newsroom";

  return (
    <Link
      href={`/article/${event.id}`}
      className="card-surface animate-fade-up group flex flex-col rounded-3xl p-3"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 via-violet-500 to-fuchsia-400">
            <span className="text-3xl font-black tracking-tight text-white/90">{initials(source)}</span>
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] font-semibold uppercase tracking-widest text-white/70">
              {source}
            </div>
          </div>
        )}

        {/* subtle gradient scrim keeps the badge readable on busy photos */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />

        {event.verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {event.sourceCount} sources
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span className={`eyebrow ${categoryColor(event.category)}`}>{event.category}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400">{timeAgo(event.publishedAt)}</span>
        </div>
        <h3 className="font-display line-clamp-2 text-[17px] leading-[1.28] text-slate-900 transition group-hover:text-violet-700">
          {event.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{event.summary}</p>
        <div className="mt-auto flex items-center justify-between pt-3.5">
          <span className="inline-flex items-center gap-1.5 truncate text-xs text-slate-400">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-600">
              {initials(source)}
            </span>
            {source}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 transition group-hover:text-violet-600">
            Read
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
