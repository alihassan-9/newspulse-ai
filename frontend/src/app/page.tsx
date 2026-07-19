import Link from "next/link";
import { getAllEvents } from "@/lib/news-service";
import EventCard from "@/components/EventCard";
import { timeAgo } from "@/lib/format";
import { categoryColor } from "@/lib/categories";
import type { NewsEvent } from "@/lib/verify";

export const metadata = { title: "Home · NewsPulse AI" };
export const dynamic = "force-dynamic";

const CHIPS: { label: string; href: string }[] = [
  { label: "Latest", href: "/" },
  { label: "World", href: "/international" },
  { label: "Politics", href: "/us-news" },
  { label: "Business", href: "/us-news" },
  { label: "Technology", href: "/us-news" },
  { label: "Science", href: "/us-news" },
  { label: "Celebrity", href: "/celebrity" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function monogram(text: string) {
  const w = text.replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/).slice(0, 2);
  return w.map((x) => x[0]?.toUpperCase() ?? "").join("") || "NP";
}

export default async function Home() {
  const { usEvents, celebrityEvents } = await getAllEvents();
  const all = [...usEvents, ...celebrityEvents];

  const feed = [...all]
    .sort((a, b) => {
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
    })
    .slice(0, 6);

  const editorsPick = all.filter((e) => e.verified).slice(0, 5);

  const verifiedCount = all.filter((e) => e.verified).length;
  const publishers = new Set(all.flatMap((e) => e.sources)).size;

  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const date = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mx-auto max-w-[1360px] px-7 py-7">
      {/* Masthead row (full width) */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[27px] leading-tight text-slate-900">{greeting()}, Aspas</h1>
          <p className="mt-1 text-sm text-slate-400">Here&apos;s what the newsroom verified for you today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{weekday}</p>
          <p className="text-xs text-slate-400">{date}</p>
        </div>
      </div>

      {/* Hero — spans the full content width */}
      <section className="animate-fade-up relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 px-9 py-10 text-white shadow-[var(--shadow-lg)]">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-white/20 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            Live newsroom
          </span>
          <h2 className="font-display font-display-tight mt-3 text-[40px] leading-[1.05]">Catch up on what actually matters.</h2>
          <p className="mt-3 max-w-lg text-[15px] text-white/85">
            Cross-checked across trusted publishers, verified, and ready to read — no noise.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/us-news"
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-violet-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
            >
              Explore top stories
            </Link>
            <Link
              href="/celebrity"
              className="inline-flex rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Celebrity
            </Link>
          </div>

          <div className="mt-8 flex gap-8">
            <Stat value={all.length} label="Stories" />
            <Stat value={verifiedCount} label="Verified" />
            <Stat value={publishers} label="Publishers" />
          </div>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-24 top-20 h-32 w-32 rounded-3xl bg-white/10 blur-sm" />
        <svg className="pointer-events-none absolute bottom-0 right-10 hidden h-48 w-64 text-white/20 lg:block" viewBox="0 0 200 140" fill="none">
          <rect x="30" y="30" width="150" height="90" rx="10" fill="currentColor" />
          <path d="M40 50h110M40 66h110M40 82h80" stroke="white" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </section>

      {/* Cards + right rail */}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_312px]">
        <div className="min-w-0">
          {/* Tabs */}
          <div className="mb-5 flex items-center gap-7 border-b border-slate-200 text-[15px] font-semibold">
            <span className="relative pb-3 text-violet-700">
              Trending
              <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-violet-600" />
            </span>
            <Link href="/us-news" className="pb-3 text-slate-400 transition hover:text-slate-700">US News</Link>
            <Link href="/international" className="pb-3 text-slate-400 transition hover:text-slate-700">International</Link>
            <Link href="/celebrity" className="pb-3 text-slate-400 transition hover:text-slate-700">Celebrity</Link>
          </div>

          {/* Chips */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {CHIPS.map((c, i) => (
              <Link
                key={c.label}
                href={c.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  i === 0
                    ? "bg-violet-600 text-white shadow-[var(--shadow-sm)]"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-600"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>

          {feed.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
              No live stories yet. The feeds may be temporarily unreachable.
            </p>
          ) : (
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
              {feed.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>

        {/* Right rail — nudged down so it starts parallel with the news cards */}
        <aside className="space-y-7 xl:mt-[104px]">
          <section className="card-surface rounded-3xl p-5">
            <RailHead title="Editor's Pick" href="/us-news" />
            <div className="mt-4 space-y-1">
              {editorsPick.length === 0 ? (
                <p className="text-sm text-slate-400">No verified stories yet.</p>
              ) : (
                editorsPick.map((e) => <PickItem key={e.id} event={e} />)
              )}
            </div>
          </section>

          <section className="card-surface rounded-3xl p-5">
            <RailHead title="Browse Topics" href="/us-news" />
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "Politics", href: "/us-news" },
                { label: "Business", href: "/us-news" },
                { label: "Technology", href: "/us-news" },
                { label: "Science", href: "/us-news" },
                { label: "Health", href: "/us-news" },
                { label: "Celebrity", href: "/celebrity" },
              ].map((t) => (
                <Link
                  key={t.label}
                  href={t.href}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600"
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-display text-[30px] leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/70">{label}</p>
    </div>
  );
}

function RailHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display text-[19px] text-slate-900">{title}</h3>
      <Link href={href} className="flex items-center gap-0.5 text-xs font-medium text-violet-500 transition hover:text-violet-700">
        See all ›
      </Link>
    </div>
  );
}

function PickItem({ event }: { event: NewsEvent }) {
  return (
    <Link href={`/article/${event.id}`} className="group -mx-2 flex gap-3 rounded-2xl px-2 py-2 transition hover:bg-violet-50/60">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-400">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-sm font-black text-white/90">{monogram(event.sources[0] ?? "NP")}</span>
        )}
      </div>
      <div className="min-w-0 self-center">
        <div className="mb-1 flex items-center gap-1.5">
          <span className={`eyebrow text-[10px] ${categoryColor(event.category)}`}>{event.category}</span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-400">{timeAgo(event.publishedAt)}</span>
        </div>
        <p className="font-display line-clamp-2 text-[14.5px] leading-[1.28] text-slate-800 group-hover:text-violet-700">
          {event.title}
        </p>
      </div>
    </Link>
  );
}
