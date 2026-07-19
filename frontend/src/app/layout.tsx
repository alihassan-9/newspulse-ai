import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AutoRefresh from "@/components/AutoRefresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display + reading serif (optical sizing). Used for all headlines
// and article body to give the platform a professional newsroom voice.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "NewsPulse AI",
  description: "Autonomous US and celebrity news intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex h-screen">
          <Sidebar />
          <div className="m-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f7fe] shadow-[var(--shadow-lg)] lg:my-2 lg:mr-2 lg:rounded-3xl lg:border lg:border-violet-100/70">
            <Topbar />
            <main className="scroll-slim flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
            {/* Pulls fresh stories every 5 minutes */}
            <AutoRefresh />
          </div>
        </div>
      </body>
    </html>
  );
}
