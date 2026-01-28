"use client";

import AppShell from "@/app/_components/AppShell";
import Link from "next/link";

function Card({
  href,
  title,
  subtitle,
  children,
}: {
  href: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-black/40">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-black/60">
          {children}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold tracking-tight text-black/90 dark:text-white/90">
          {title}
        </div>
        <div className="mt-1 text-xs text-black/60 dark:text-white/60">
          {subtitle}
        </div>
      </div>
    </Link>
  );
}

/* ---------------- OG helpers ---------------- */

function Meter({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const bar =
    p >= 70 ? "bg-red-500/70" : p >= 35 ? "bg-yellow-500/70" : "bg-emerald-500/70";

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[11px] text-black/60 dark:text-white/60">
        <span>AI likelihood</span>
        <span className="text-black/85 dark:text-white/85">{p}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${p}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-black/50 dark:text-white/50">
        <span className="text-emerald-600 dark:text-emerald-300">Human</span>
        <span className="text-red-600 dark:text-red-300">AI</span>
      </div>
    </div>
  );
}

function MountainThumb() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-black/50">
      <svg viewBox="0 0 260 110" className="h-20 w-full">
        <rect x="0" y="0" width="260" height="110" rx="18" fill="rgba(255,255,255,0.04)" />
        <circle cx="210" cy="28" r="12" fill="rgba(255,255,255,0.22)" />
        <path d="M20 96 L92 40 L135 80 L165 58 L240 96 Z" fill="rgba(255,255,255,0.10)" />
        <path d="M64 96 L112 58 L144 96 Z" fill="rgba(255,255,255,0.16)" />
        <path d="M92 44 L102 58 L84 58 Z" fill="rgba(255,255,255,0.28)" />
      </svg>
    </div>
  );
}

function HighlightLines() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-[92%] rounded bg-emerald-500/25" />
      <div className="h-3 w-[86%] rounded bg-yellow-500/25" />
      <div className="h-3 w-[95%] rounded bg-red-500/25" />
      <div className="h-3 w-[78%] rounded bg-emerald-500/25" />
      <div className="h-3 w-[88%] rounded bg-yellow-500/25" />
    </div>
  );
}

/* ---------------- OG Text illustration ---------------- */

function TextDetectorIllustration() {
  return (
    <div className="relative h-full w-full p-5">
      <div className="relative grid h-full grid-cols-2 gap-4">
        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-black/50">
          <div className="mb-3 h-8 w-20 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="space-y-2">
            <div className="h-2 w-11/12 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-2 w-9/12 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-2 w-10/12 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-2 w-7/12 rounded bg-black/10 dark:bg-white/10" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-20 rounded-xl bg-black/10 dark:bg-white/10" />
            <div className="h-6 w-20 rounded-xl bg-black/10 dark:bg-white/10" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-black/50">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-16 rounded bg-black/10 dark:bg-white/10" />
          </div>

          <div className="rounded-xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-black/60">
            <HighlightLines />
          </div>

          <Meter pct={41} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- OG Image illustration ---------------- */

function ImageDetectorIllustration() {
  return (
    <div className="relative h-full w-full p-5">
      <div className="relative h-full rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-black/50">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-32 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-7 w-20 rounded-xl bg-black/10 dark:bg-white/10" />
        </div>

        <MountainThumb />
        <Meter pct={72} />
      </div>
    </div>
  );
}

/* ---------------- Typer (REVERTED version) ---------------- */

function GhostTyperIllustration() {
  return (
    <div className="relative h-full w-full p-5">
      <div className="grid h-full grid-cols-2 gap-4">
        {/* Document */}
        <div className="rounded-2xl border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-black/50">
          <div className="mb-3 flex gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-11/12 rounded bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-10/12 rounded bg-black/10 dark:bg-white/10" />
            <div className="relative h-3 w-8/12 rounded bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="typing-doc absolute inset-y-0 left-0 bg-black/30 dark:bg-white/30" />
            </div>
            <div className="h-3 w-7/12 rounded bg-black/10 dark:bg-white/10" />
          </div>
        </div>

        {/* Typer window */}
        <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-black/55">
          <div className="mb-2 text-xs font-semibold">Ghost Typer</div>

          <div className="rounded-xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-black/60">
            <div className="mb-2 text-xs opacity-70">Typing output</div>
            <div className="relative h-3 w-10/12 rounded bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="typing-app absolute inset-y-0 left-0 bg-black/40 dark:bg-white/40" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .typing-doc {
          width: 0%;
          animation: type 3s infinite;
        }
        .typing-app {
          width: 0%;
          animation: type 2.4s infinite;
        }
        @keyframes type {
          0% { width: 0%; }
          65% { width: 100%; }
          85% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
}

function TyperIllustration() {
  return <GhostTyperIllustration />;
}

/* ---------------- Page ---------------- */

export default function HomePage() {
  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Pick a tool to get started.
          </div>
        </div>

        <div className="mb-3 text-sm font-semibold text-black/70 dark:text-white/70">
          Featured
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card href="/detect/text" title="AI Text Detector" subtitle="Check AI probability and sentence highlights.">
            <TextDetectorIllustration />
          </Card>

          <Card href="/detect/image" title="AI Image Detector" subtitle="Analyze images and save results.">
            <ImageDetectorIllustration />
          </Card>

          <Card href="/download" title="Ghost Typer" subtitle="Type anywhere with human-like behavior controls.">
            <TyperIllustration />
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
