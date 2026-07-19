"use client";

import { useEffect, useState } from "react";

type Props = {
  title: string;
  summary: string;
  category: string;
  source?: string;
  imageUrl?: string;
  /** Article paragraphs, used for the "Download article" PDF. */
  body?: string[];
};

type Ratio = "1:1" | "9:16" | "16:9";

type State =
  | { status: "setup" }
  | { status: "loading" }
  | { status: "done"; image: string; aiBackground: boolean }
  | { status: "error"; message: string };

const RATIOS: { value: Ratio; label: string; hint: string }[] = [
  { value: "1:1", label: "1:1 · Square", hint: "Instagram feed, X" },
  { value: "9:16", label: "9:16 · Portrait", hint: "Stories, Reels, TikTok" },
  { value: "16:9", label: "16:9 · Landscape", hint: "YouTube, X banner" },
];

const PREVIEW: Record<Ratio, string> = {
  "1:1": "h-40 w-40",
  "9:16": "h-48 w-27",
  "16:9": "h-28 w-48",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "newspulse";
}

export default function GeneratePostButton({ title, summary, category, source, imageUrl, body }: Props) {
  const [state, setState] = useState<State>({ status: "setup" });
  const [open, setOpen] = useState(false);
  const [ratio, setRatio] = useState<Ratio>("1:1");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Opens the panel only — the user picks a ratio and presses Generate.
  function openPanel() {
    setState({ status: "setup" });
    setOpen(true);
  }

  async function generate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, summary, category, source, imageUrl, ratio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.hint || data.error || "Generation failed." });
        return;
      }
      setState({ status: "done", image: data.image, aiBackground: !!data.aiBackground });
    } catch {
      setState({ status: "error", message: "Network error while generating the post." });
    }
  }

  /** Download the article itself as a paginated PDF. */
  async function downloadArticlePdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 56;
    const maxW = pageW - margin * 2;
    let y = margin;

    const nextPageIfNeeded = (lineHeight: number) => {
      if (y + lineHeight > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    for (const line of doc.splitTextToSize(title, maxW)) {
      nextPageIfNeeded(26);
      doc.text(line, margin, y);
      y += 26;
    }

    // Byline
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    const meta = [category, source, new Date().toLocaleDateString("en-US", { dateStyle: "medium" })]
      .filter(Boolean)
      .join("  ·  ");
    nextPageIfNeeded(16);
    doc.text(meta, margin, y);
    y += 10;
    doc.setDrawColor(210);
    doc.line(margin, y, pageW - margin, y);
    y += 22;

    // Body
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(30);
    for (const para of body?.length ? body : [summary]) {
      for (const line of doc.splitTextToSize(para, maxW)) {
        nextPageIfNeeded(17);
        doc.text(line, margin, y);
        y += 17;
      }
      y += 10; // paragraph spacing
    }

    doc.save(`${slugify(title)}.pdf`);
  }

  return (
    <>
      <button
        onClick={openPanel}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-500 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-[var(--shadow-sm)]"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        Generate Post
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="animate-scale-in flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border-t-4 border-red-500 bg-white shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h4 className="font-display text-[19px] text-slate-900">Generate social post</h4>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="scroll-slim flex-1 overflow-y-auto p-6">
              {/* Step 1 — choose the ratio, then generate. */}
              {state.status === "setup" && (
                <div>
                  <label htmlFor="np-ratio" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Choose a ratio
                  </label>
                  <select
                    id="np-ratio"
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value as Ratio)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-violet-300 focus:border-violet-400"
                  >
                    {RATIOS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label} — {r.hint}
                      </option>
                    ))}
                  </select>

                  <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-8">
                    <div className={`${PREVIEW[ratio]} grid place-items-center rounded-lg border-2 border-slate-300 bg-white text-[10px] font-semibold text-slate-400`}>
                      {ratio}
                    </div>
                    <p className="mt-4 max-w-xs text-center text-xs text-slate-400">
                      {RATIOS.find((r) => r.value === ratio)?.hint}
                    </p>
                  </div>

                  <button
                    onClick={generate}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    Generate {ratio} post
                  </button>
                </div>
              )}

              {state.status === "loading" && (
                <div className="flex h-72 flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-red-500 border-t-transparent" />
                  <p className="text-sm">Composing your {ratio} post…</p>
                </div>
              )}

              {state.status === "done" && (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={state.image} alt="Generated post" className="mx-auto max-h-[46vh] w-auto rounded-2xl border border-slate-200 shadow-[var(--shadow-sm)]" />
                  {state.aiBackground && (
                    <p className="mt-3 text-center text-[11px] text-slate-400">
                      No photo on this story, so the background was generated with Nano Banana.
                    </p>
                  )}
                </div>
              )}

              {state.status === "error" && (
                <div className="flex h-72 flex-col items-center justify-center gap-4 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-2xl">⚠️</div>
                  <p className="text-sm text-red-700">{state.message}</p>
                  <button onClick={() => setState({ status: "setup" })} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
                    Back
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              {state.status === "done" && (
                <>
                  <a
                    href={state.image}
                    download={`${slugify(title)}-${ratio.replace(":", "x")}.png`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
                    </svg>
                    Download post
                  </a>
                  <button
                    onClick={() => setState({ status: "setup" })}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Change ratio
                  </button>
                </>
              )}
              <button
                onClick={downloadArticlePdf}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5M9 13h6M9 17h4" />
                </svg>
                Download article (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
