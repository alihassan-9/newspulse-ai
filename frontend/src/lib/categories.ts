// Per-category accent color (matches the reference design's colored labels).

const MAP: Record<string, string> = {
  Politics: "text-violet-600",
  National: "text-rose-500",
  Business: "text-amber-500",
  Technology: "text-indigo-500",
  Science: "text-sky-500",
  Health: "text-emerald-500",
  "US Celebrity": "text-fuchsia-500",
  "UK Celebrity": "text-fuchsia-500",
  "CA Celebrity": "text-fuchsia-500",
  "AU Celebrity": "text-fuchsia-500",
};

export function categoryColor(category: string): string {
  return MAP[category] ?? "text-violet-600";
}

/** Deterministic soft avatar color from a name (for source/contributor chips). */
const AVATARS = [
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-indigo-500",
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATARS[Math.abs(h) % AVATARS.length];
}
