"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "./_components/AppShell";
import { supabase } from "@/lib/supabaseClient";

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
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
  preview_text: string | null;
  created_at: string;
  kind: "text";
};

type SavedImageScan = {
  id: string;
  title: string | null;
  image_url: string | null;
  created_at: string;
  kind: "image";
};

function PlaceholderGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-dashed border-white/20 bg-white/3 p-4">
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
  const preview = (scan.preview_text || "").trim().slice(0, 130);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/scans/text/${scan.id}`} className="block">
            <div className="truncate text-sm font-semibold hover:underline">{title}</div>
          </Link>

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
          <Link href={`/scans/image/${scan.id}`} className="block">
            <div className="truncate text-sm font-semibold hover:underline">{title}</div>
          </Link>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {scan.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={scan.image_url} alt={title} className="h-24 w-full object-cover" />
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

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive.current) return;
      setIsAuthed(!!data.session);
      setSessionReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (!alive.current) return;
        setIsAuthed(!!session);
        setSessionReady(true);
      });

      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function loadRecent() {
    if (!alive.current) return;

    setSavedText(null);
    setSavedImages(null);

    const token = await getAccessToken();
    if (!token) {
      if (!alive.current) return;
      setSavedText([]);
      setSavedImages([]);
      return;
    }

    try {
      // ✅ use kind= (NOT type=)
      const [tRes, iRes] = await Promise.all([
        fetch("/api/scans?kind=text", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/scans?kind=image", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!alive.current) return;

      if (tRes.status === 401 || iRes.status === 401) {
        setSavedText([]);
        setSavedImages([]);
        return;
      }

      const tJson = await tRes.json().catch(() => ({}));
      const iJson = await iRes.json().catch(() => ({}));

      if (!tRes.ok) throw new Error(tJson?.error || `Text fetch failed (${tRes.status})`);
      if (!iRes.ok) throw new Error(iJson?.error || `Image fetch failed (${iRes.status})`);

      const tArr = Array.isArray(tJson.scans) ? tJson.scans : [];
      const iArr = Array.isArray(iJson.scans) ? iJson.scans : [];

      // normalize + take 3
      const tFixed: SavedTextScan[] = tArr.slice(0, 3).map((r: any) => ({
        id: String(r.id),
        title: (r.title ?? null) as string | null,
        preview_text: (r.preview_text ?? r.text_preview ?? null) as string | null,
        created_at: String(r.created_at ?? new Date().toISOString()),
        kind: "text",
      }));

      const iFixed: SavedImageScan[] = iArr.slice(0, 3).map((r: any) => ({
        id: String(r.id),
        title: (r.title ?? null) as string | null,
        image_url: (r.image_url ?? null) as string | null,
        created_at: String(r.created_at ?? new Date().toISOString()),
        kind: "image",
      }));

      setSavedText(tFixed);
      setSavedImages(iFixed);
    } catch {
      if (!alive.current) return;
      setSavedText([]);
      setSavedImages([]);
    }
  }

  useEffect(() => {
    if (!canShowSaved) {
      setSavedText(null);
      setSavedImages(null);
      return;
    }
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShowSaved]);

  async function renameText(id: string, newTitle: string) {
    const title = newTitle.trim() || "Untitled";
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch("/api/scans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, title }),
    });

    if (!res.ok) return;

    setSavedText((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, title } : s)) : prev));
  }

  async function deleteText(id: string) {
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch("/api/scans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) return;

    setSavedText((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }

  async function renameImage(id: string, newTitle: string) {
    const title = newTitle.trim() || "Untitled";
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch("/api/scans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, title }),
    });

    if (!res.ok) return;

    setSavedImages((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, title } : s)) : prev));
  }

  async function deleteImage(id: string) {
    const token = await getAccessToken();
    if (!token) return;

    const res = await fetch("/api/scans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) return;

    setSavedImages((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Start AI Text Scan" desc="Check whether text looks AI-written." href="/detect/text" />
          <Card title="Start AI Image Scan" desc="Analyze images for AI generation." href="/detect/image" />
        </div>

        <div className="mt-8 grid gap-6">
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
                  href="/scans/text"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  View all
                </Link>
              </div>
            </div>

            {!isAuthed ? (
              <PlaceholderGrid count={3} />
            ) : savedText === null ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">Loading…</div>
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
                  href="/scans/image"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  View all
                </Link>
              </div>
            </div>

            {!isAuthed ? (
              <PlaceholderGrid count={3} />
            ) : savedImages === null ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">Loading…</div>
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

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Recent</div>
            <div className="mt-2 text-sm text-white/60">We’ll expand this later with full history + filters.</div>
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
