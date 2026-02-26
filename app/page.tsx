// app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
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
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(!!data.session);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const ctaHref = isAuthed ? "/dashboard" : "/login?next=/dashboard";
  const ctaLabel = isAuthed ? "Go to Dashboard →" : "Get Started →";

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

          {/* ✅ Only ONE button now */}
          <div className="flex items-center gap-2">
            <Link
              href={ctaHref}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              {ctaLabel}
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
                href={ctaHref}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                {ctaLabel}
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

          {/* ✅ Clean video block */}
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 md:p-4">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black backdrop-blur">
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
          </div>
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