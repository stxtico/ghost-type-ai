// app/featured/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

function GhostMark({ className }: { className?: string }) {
  return (
    <Image
      src="/branding/ghost-light.png"
      alt="Ghost Typer"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
}

function FeatureCard({
  href,
  title,
  subtitle,
  bullets,
}: {
  href: string;
  title: string;
  subtitle: string;
  bullets: string[];
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight text-white/90">
            {title}
          </div>
          <div className="mt-1 text-sm text-white/60">{subtitle}</div>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
          Open
        </span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-white/75">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/85 group-hover:text-white">
        Launch <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </Link>
  );
}

export default function FeaturedPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <GhostMark className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-tight">
              Ghost Typer
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/featured" className="text-white">
              Featured
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login?next=/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/login?next=/dashboard"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Product description */}
        <div className="mb-6">
          <div className="text-3xl font-semibold tracking-tight">Featured</div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
            Ghost Typer combines AI detection for text and images with a realistic
            typing tool. You can scan, review, and keep everything organized — then
            type naturally anywhere using speed, pauses, and mistake controls.
          </p>
        </div>

        {/* Big video placeholder (looping) */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-3 md:p-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-linear-to-b from-white/10 to-white/0">
            <div className="absolute inset-0">
              <div className="gt-loop absolute inset-0 opacity-40" />
              <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-base font-semibold text-white/90">
                  Featured video placeholder
                </div>
                <div className="mt-1 text-xs text-white/55">
                  (Later: your looping product demo)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 tools */}
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            href="/detect/text"
            title="AI Text Detector"
            subtitle="Paste text and get a clear AI likelihood score."
            bullets={[
              "Sentence-level highlights showing AI-like parts.",
              "Fast scanning for essays, posts, and messages.",
              "Save results to your account for later.",
            ]}
          />

          <FeatureCard
            href="/detect/image"
            title="AI Image Detector"
            subtitle="Upload an image to check if it’s AI-generated."
            bullets={[
              "Confidence score with a simple explanation.",
              "Works for screenshots and AI art checks.",
              "Save image scan results to your dashboard.",
            ]}
          />

          <FeatureCard
            href="/download"
            title="Ghost Typer"
            subtitle="Type anywhere with human-like behavior controls."
            bullets={[
              "Adjust speed, pauses, and mistakes.",
              "Natural typing for any app/site.",
              "Built for realistic, controllable output.",
            ]}
          />
        </div>

        <style jsx>{`
          .gt-loop {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.02),
              rgba(255, 255, 255, 0.06),
              rgba(255, 255, 255, 0.02)
            );
            background-size: 200% 100%;
            animation: gtLoop 2.2s linear infinite;
          }
          @keyframes gtLoop {
            0% {
              background-position: 0% 0%;
            }
            100% {
              background-position: 200% 0%;
            }
          }
        `}</style>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-white/50">
          © {new Date().getFullYear()} Ghost Typer
        </div>
      </footer>
    </div>
  );
}
