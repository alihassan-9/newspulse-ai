import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/news-service";
import GeneratePostButton from "@/components/GeneratePostButton";
import { timeAgo } from "@/lib/format";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getEventById(id);
  if (!result) notFound();
  const { event, article } = result;

  const heroImage = article?.image || event.image;
  const body = article?.paragraphs?.length ? article.paragraphs : [event.summary];
  const readMins = Math.max(1, Math.round(body.join(" ").split(/\s+/).length / 220));

  return (
    <div className="w-full px-8 py-8 lg:px-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-500 shadow-[var(--shadow-xs)] transition hover:-translate-x-0.5 hover:text-slate-800"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back
      </Link>

      {/* Header block — full width */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{event.category}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              event.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {event.verified && (
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {event.verificationLabel}
          </span>
          <span className="text-xs text-slate-400">{timeAgo(event.publishedAt)}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400">{readMins} min read</span>
        </div>
        <GeneratePostButton
          title={event.title}
          summary={event.summary}
          category={event.category}
          source={event.sources[0]}
          imageUrl={heroImage ?? undefined}
          body={body}
        />
      </div>

      <h1 className="font-display font-display-tight max-w-4xl text-[44px] leading-[1.06] text-slate-900">{event.title}</h1>
      <p className="mt-4 border-b border-slate-200 pb-6 text-sm text-slate-400">
        Reported by <span className="font-medium text-slate-600">{event.sources.join(", ")}</span>
        {article?.siteName ? ` · via ${article.siteName}` : ""}
      </p>

      {/* Article flow — infobox floats top-right, body wraps left then full width */}
      <div className="article-body mt-7">
        {(heroImage || article?.postImage) && (
          <aside className="mb-5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-sm)] sm:float-right sm:mb-5 sm:ml-9 sm:w-[440px] lg:w-[520px]">
            {heroImage ? (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="w-full object-cover" />
                <figcaption className="px-3 py-2 font-sans text-[11px] leading-snug text-slate-400">
                  {event.category} · {event.sources[0]}
                </figcaption>
              </figure>
            ) : null}
            {article?.postImage ? (
              <figure className="border-t border-slate-100">
                <div className="flex items-center gap-1.5 px-3 pt-2 font-sans text-[11px] font-semibold text-violet-700">
                  <span>🍌</span> AI post · Nano Banana
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.postImage} alt="AI generated post" className="w-full p-3" />
              </figure>
            ) : null}
          </aside>
        )}

        {body.map((p, i) => (
          <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:text-[3.6rem] first-letter:font-semibold first-letter:leading-[0.72] first-letter:text-violet-600" : ""}>
            {p}
          </p>
        ))}

        <div className="clear-both" />
      </div>

      {!article?.paragraphs?.length && (
        <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Full text couldn&apos;t be extracted from the publisher. Read the complete story at the original sources below.
        </p>
      )}

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-sm)]">
        <h2 className="font-display mb-4 flex items-center gap-2 text-[18px] text-slate-900">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
          </svg>
          Original sources ({event.stories.length})
        </h2>
        <ul className="space-y-1">
          {event.stories.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-violet-50/60">
              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-medium text-violet-700 hover:underline"
              >
                <span className="text-slate-400">{s.source}</span> · {s.title}
              </a>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{s.credibility}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
