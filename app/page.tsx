// app/page.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo + text clickable back to landing */}
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
            <Link href="/featured" className="hover:text-white">
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

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              AI Detection + Human-like Typing
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Detect AI. Scan images.
              <span className="block text-white/70">
                Type naturally anywhere.
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/65">
              Ghost Typer helps you check AI likelihood on text and images, then
              type with human-like controls — speed, pauses, and mistakes — all
              in one clean dashboard.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login?next=/dashboard"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Get Started →
              </Link>

              <Link
                href="/featured"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
              >
                Explore features
              </Link>

              <Link
                href="/pricing"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* BIG centered video placeholder */}
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 md:p-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-linear-to-b from-white/10 to-white/0">
                {/* Looping placeholder "video" */}
                <div className="absolute inset-0">
                  <div className="gt-loop absolute inset-0 opacity-40" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-full max-w-5xl mb-10">
  <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black backdrop-blur">
    <video
      src="/videos/Project - Made with Clipchamp.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="h-full w-full object-cover"
    />
  </div>
</div>
                    <div className="mt-1 text-xs text-white/55">
                     
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 text-sm text-white/50">
          © {new Date().getFullYear()} Ghost Typer
        </div>
      </footer>
    </div>
  );
}
