"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "./_components/AppShell";
import { supabase } from "@/lib/supabaseClient";

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-2 text-sm text-white/60">{desc}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-sm text-white/70 group-hover:text-white">
          →
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthed(!!data.session);
      setSessionReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setIsAuthed(!!session);
      });
      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  return (
    <AppShell>
      <main className="px-10 py-8">
        {/* Page header (inside content) */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
            <div className="mt-1 text-sm text-white/60">
              Choose a tool to get started.
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Only show auth buttons once we know session state */}
            {sessionReady ? (
              isAuthed ? (
                <Link
                  href="/account"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Login
                </Link>
              )
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                Checking…
              </div>
            )}
          </div>
        </div>

        {/* Big cards row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            title="Start AI Text Scan"
            desc="Check whether text looks AI-written."
            href="/detect/text"
          />
          <Card
            title="Start AI Image Scan"
            desc="Analyze images for AI generation."
            href="/detect/image"
          />
        </div>

        {/* Secondary section */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Recent</div>
            <div className="mt-2 text-sm text-white/60">
              We’ll show your recent scans here after we add history logging.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Desktop Typer</div>
            <div className="mt-2 text-sm text-white/60">
              Download the AAI typer for system-level human typing.
            </div>
            <Link
              href="/download"
              className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              Go to Download
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
