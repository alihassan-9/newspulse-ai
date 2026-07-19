"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; soon?: boolean };

const MAIN: Item[] = [
  { href: "/", label: "Home", icon: "M3 11.5 12 4l9 7.5M5 10v9h5v-6h4v6h5v-9" },
  { href: "/us-news", label: "US News", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/international", label: "International", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" },
  { href: "/celebrity", label: "Celebrity News", icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 21l-5.2 2.9 1-5.8L3.5 9.2l5.9-.9z" },
  { href: "/bookmarks", label: "Bookmarks", icon: "M6 4h12v16l-6-4-6 4z", soon: true },
];

const DISCOVER: Item[] = [
  { href: "/discover/category", label: "Category", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", soon: true },
  { href: "/discover/video", label: "Video", icon: "M4 6h11v12H4zM15 10l5-3v10l-5-3z", soon: true },
  { href: "/discover/live", label: "Live", icon: "M12 12h.01M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a9.5 9.5 0 0 0 0 14M19 5a9.5 9.5 0 0 1 0 14", soon: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="hidden w-[236px] shrink-0 flex-col px-3 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[var(--shadow-sm)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h10M4 12h16M4 18h8" />
          </svg>
        </span>
        <span className="font-display text-[23px] font-semibold tracking-tight">
          <span className="text-slate-900">News</span>
          <span className="text-violet-600">Pulse</span>
        </span>
      </Link>

      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Main Menu</p>
      <nav className="flex flex-col gap-1">
        {MAIN.map((i) => (
          <NavItem key={i.href} item={i} active={isActive(i.href)} />
        ))}
      </nav>

      <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Discover</p>
      <nav className="flex flex-col gap-1">
        {DISCOVER.map((i) => (
          <NavItem key={i.href} item={i} active={isActive(i.href)} small />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-6">
        <div className="mb-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-4 text-white shadow-[var(--shadow-sm)]">
          <p className="font-display text-[16px]">AI Newsroom</p>
          <p className="mt-1 text-[11px] leading-snug text-white/85">Verified, cross-checked stories with Nano Banana post art.</p>
        </div>
        <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-50">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 12H3m0 0 4-4m-4 4 4 4M11 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item, active, small }: { item: Item; active: boolean; small?: boolean }) {
  const { href, label, icon, soon } = item;
  const iconEl = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={small ? "h-[18px] w-[18px]" : "h-5 w-5"}>
      <path d={icon} />
    </svg>
  );

  if (soon) {
    return (
      <span
        aria-disabled="true"
        title="Coming soon"
        className={`group relative flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 ${small ? "pl-4" : ""}`}
      >
        {iconEl}
        {label}
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Soon</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-violet-50 text-violet-700 shadow-[var(--shadow-xs)]" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
      } ${small ? "pl-4" : ""}`}
    >
      {active && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />}
      {iconEl}
      {label}
    </Link>
  );
}
