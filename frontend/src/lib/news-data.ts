export type Story = {
  category: string;
  title: string;
  summary: string;
  source: string;
  credibility: string;
  link?: string;
  image?: string | null;
  region?: string;
  publishedAt?: number | null;
};

import type { NewsEvent } from "@/lib/verify";

export type NewsletterData = {
  live: boolean;
  generatedAt: string;
  hero: { kicker: string; title: string; summary: string };
  metrics: { label: string; value: string }[];
  usEvents: NewsEvent[];
  celebrityEvents: NewsEvent[];
  pipeline: { step: string; status: string }[];
  preferences: string[];
  headlines: string[];
};

export const newsroomOverview = {
  hero: {
    title: "Today's US Intelligence Brief",
    summary:
      "A premium, verified digest of the most important U.S. and celebrity developments, rewritten for readers who want context over noise.",
    kicker: "Verified • Neutral • Daily Magazine",
  },
  metrics: [
    { label: "Live news feed", value: "24/7" },
    { label: "Verified stories", value: "18" },
    { label: "Open rate", value: "68%" },
    { label: "Subscriber growth", value: "+12%" },
  ],
  usStories: [
    {
      category: "Politics",
      title: "Debt ceiling negotiations enter a high-stakes final stretch",
      summary:
        "Officials are narrowing the debate around spending discipline and revenue measures while markets watch for a durable compromise.",
      source: "Reuters",
      credibility: "99%",
    },
    {
      category: "Technology",
      title: "AI policy talks accelerate as regulators target enterprise deployment",
      summary:
        "New guidance is pushing companies to document risk controls and disclose model usage more clearly in customer communications.",
      source: "AP",
      credibility: "97%",
    },
    {
      category: "Health",
      title: "Hospital systems expand remote monitoring for chronic care",
      summary:
        "Providers are leaning on connected devices to reduce readmissions and improve continuity between appointments.",
      source: "CNN",
      credibility: "95%",
    },
  ],
  celebrityStories: [
    {
      category: "US Celebrity",
      title: "A major studio launch reshapes the summer awards conversation",
      summary:
        "Industry observers say the media rollout and strong critical response have moved the title into the center of the season's conversation.",
      source: "People",
      credibility: "96%",
    },
    {
      category: "UK Celebrity",
      title: "Royal family headlines stay focused on public engagement and charity work",
      summary:
        "The latest appearances underscore a strategy centered on service, cultural outreach, and careful media management.",
      source: "BBC",
      credibility: "97%",
    },
    {
      category: "Australia",
      title: "A streaming talent showcase draws renewed attention from local audiences",
      summary:
        "The release is prompting discussion about the balance between breakout performances and franchise loyalty in the market.",
      source: "The Guardian",
      credibility: "94%",
    },
  ],
  pipeline: [
    { step: "Discovery", status: "Active" },
    { step: "Verification", status: "Healthy" },
    { step: "Rewrite", status: "Queued" },
    { step: "Email delivery", status: "Scheduled" },
  ],
  preferences: [
    "US News",
    "Politics",
    "Business",
    "Technology",
    "Celebrity News",
    "Movies",
    "TV",
    "Music",
  ],
  headlines: [
    "Markets stabilize after strong retail spending data",
    "New tech regulation draft gains cross-party attention",
    "Film festival circuit highlights new voices in drama",
  ],
};
