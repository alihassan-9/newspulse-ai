export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-violet-100/70 bg-white/70 px-6 py-3.5 backdrop-blur-xl">
      <form action="/search" className="relative flex-1 max-w-xl">
        <button type="submit" aria-label="Search" className="absolute left-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:text-violet-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" strokeLinecap="round" />
          </svg>
        </button>
        <input
          type="search"
          name="q"
          aria-label="Search news"
          placeholder="Search stories, topics, sources…"
          className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-11 pr-16 text-sm text-slate-700 shadow-[var(--shadow-xs)] outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:shadow-[var(--shadow-sm)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-flex">
          ↵
        </kbd>
      </form>
      <div className="ml-auto flex items-center gap-2.5 text-slate-400">
        <IconButton label="Notifications" badge path="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.5 21a1.5 1.5 0 0 0 3 0" />
        <IconButton label="Settings" path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 6 19.5l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3.3 6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 18 3.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        <div className="ml-1 flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white py-1 pl-1 pr-3 shadow-[var(--shadow-xs)]">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white ring-2 ring-white">
            AS
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-slate-800">Aspas</p>
            <p className="text-[10px] text-slate-400">Editor</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ label, path, badge }: { label: string; path: string; badge?: boolean }) {
  return (
    <button
      aria-label={label}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:text-violet-600 hover:shadow-[var(--shadow-sm)]"
    >
      {badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d={path} />
      </svg>
    </button>
  );
}
