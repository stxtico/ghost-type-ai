"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-2 text-sm text-white/60">{desc}</div>
        </div>
        <div className="shrink-0 rounded-full border border-white/10 bg-black px-3 py-1 text-sm text-white/70 group-hover:text-white">
          →
        </div>
      </div>
    </Link>
  );
}

type SavedTextScan = {
  id: string;
  title: string | null;
  text: string;
  created_at?: string;
};

type SavedImageScan = {
  id: string;
  title: string | null;
  image_url: string | null; // public URL or signed URL you store
  created_at?: string;
};

function PlaceholderGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-4"
        >
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-3 h-16 rounded-xl bg-white/5" />
          <div className="mt-3 h-8 w-28 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function SavedTextCard({
  scan,
  onRename,
  onDelete,
}: {
  scan: SavedTextScan;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}) {
  const title = (scan.title?.trim() || "Untitled").slice(0, 60);
  const preview = (scan.text || "").trim().slice(0, 130);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className="mt-2 line-clamp-3 text-xs text-white/60">
            {preview || <span className="text-white/40">No text preview.</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            onClick={() => {
              const newTitle = window.prompt("Rename scan:", title);
              if (newTitle !== null) onRename(scan.id, newTitle);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            Rename
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this scan?")) onDelete(scan.id);
            }}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 hover:bg-red-500/15"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedImageCard({
  scan,
  onRename,
  onDelete,
}: {
  scan: SavedImageScan;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}) {
  const title = (scan.title?.trim() || "Untitled").slice(0, 60);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {scan.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scan.image_url}
                alt={title}
                className="h-24 w-full object-cover"
              />
            ) : (
              <div className="flex h-24 items-center justify-center text-xs text-white/45">
                No image preview
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            onClick={() => {
              const newTitle = window.prompt("Rename scan:", title);
              if (newTitle !== null) onRename(scan.id, newTitle);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            Rename
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this scan?")) onDelete(scan.id);
            }}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100 hover:bg-red-500/15"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [savedText, setSavedText] = useState<SavedTextScan[] | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImageScan[] | null>(null);

  const canShowSaved = useMemo(() => sessionReady && isAuthed, [sessionReady, isAuthed]);

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthed(!!data.session);
      setSessionReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setIsAuthed(!!session);
        setSessionReady(true);
      });
      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  // Load saved scans (only if logged in)
  useEffect(() => {
    if (!canShowSaved) {
      setSavedText(null);
      setSavedImages(null);
      return;
    }

    (async () => {
      // TEXT SAVES
      const { data: t, error: tErr } = await supabase
        .from("saved_scans_text")
        .select("id,title,text,created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (!tErr && Array.isArray(t)) setSavedText(t as any);
      else setSavedText([]); // show placeholders if error / none

      // IMAGE SAVES
      const { data: im, error: imErr } = await supabase
        .from("saved_scans_image")
        .select("id,title,image_url,created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (!imErr && Array.isArray(im)) setSavedImages(im as any);
      else setSavedImages([]);
    })();
  }, [canShowSaved]);

  async function renameText(id: string, newTitle: string) {
    const title = newTitle.trim() || "Untitled";
    const { error } = await supabase.from("saved_scans_text").update({ title }).eq("id", id);
    if (!error) {
      setSavedText((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, title } : s)) : prev));
    }
  }

  async function deleteText(id: string) {
    const { error } = await supabase.from("saved_scans_text").delete().eq("id", id);
    if (!error) {
      setSavedText((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    }
  }

  async function renameImage(id: string, newTitle: string) {
    const title = newTitle.trim() || "Untitled";
    const { error } = await supabase.from("saved_scans_image").update({ title }).eq("id", id);
    if (!error) {
      setSavedImages((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, title } : s)) : prev));
    }
  }

  async function deleteImage(id: string) {
    const { error } = await supabase.from("saved_scans_image").delete().eq("id", id);
    if (!error) {
      setSavedImages((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    }
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
        {/* Page header (inside content) */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
            <div className="mt-1 text-sm text-white/60">Choose a tool to get started.</div>
          </div>

          <div className="flex items-center gap-3">
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
          <Card title="Start AI Text Scan" desc="Check whether text looks AI-written." href="/detect/text" />
          <Card title="Start AI Image Scan" desc="Analyze images for AI generation." href="/detect/image" />
        </div>

        {/* Saved scans previews */}
        <div className="mt-8 grid gap-6">
          {/* TEXT SAVED */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Saved Text Scans</div>
                <div className="mt-1 text-xs text-white/60">
                  {isAuthed ? "Your latest saved text scans." : "Login to see your saved scans."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/detect/text"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  New Text Scan
                </Link>
                <Link
                  href="/detect/text?saved=1"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  View all
                </Link>
              </div>
            </div>

            {!isAuthed ? (
              <PlaceholderGrid count={3} />
            ) : savedText === null ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                Loading…
              </div>
            ) : savedText.length === 0 ? (
              <PlaceholderGrid count={3} />
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {savedText.map((s) => (
                  <SavedTextCard key={s.id} scan={s} onRename={renameText} onDelete={deleteText} />
                ))}
              </div>
            )}
          </div>

          {/* IMAGE SAVED */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Saved Image Scans</div>
                <div className="mt-1 text-xs text-white/60">
                  {isAuthed ? "Your latest saved image scans." : "Login to see your saved scans."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/detect/image"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  New Image Scan
                </Link>
                <Link
                  href="/detect/image?saved=1"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  View all
                </Link>
              </div>
            </div>

            {!isAuthed ? (
              <PlaceholderGrid count={3} />
            ) : savedImages === null ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                Loading…
              </div>
            ) : savedImages.length === 0 ? (
              <PlaceholderGrid count={3} />
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {savedImages.map((s) => (
                  <SavedImageCard key={s.id} scan={s} onRename={renameImage} onDelete={deleteImage} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Secondary section */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Recent</div>
            <div className="mt-2 text-sm text-white/60">
              We’ll expand this later with full history + filters.
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Desktop Typer</div>
            <div className="mt-2 text-sm text-white/60">
              Download the Ghost Typer for system-level human typing.
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
