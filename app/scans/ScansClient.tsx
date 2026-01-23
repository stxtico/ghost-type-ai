"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ScanRow = {
  id: string;
  title: string | null;
  type: "text" | "image";
  text_preview: string | null;
  image_url: string | null;
  created_at: string;
};

function DashedCard() {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-6">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-3 h-3 w-40 rounded bg-white/5" />
      <div className="mt-6 h-24 rounded-2xl bg-white/5" />
    </div>
  );
}

function ScanCard({
  scan,
  onRename,
  onDelete,
}: {
  scan: ScanRow;
  onRename: (id: string, nextTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(scan.title || "Untitled");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full max-w-60 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
              <button
                onClick={async () => {
                  setEditing(false);
                  await onRename(scan.id, title.trim() || "Untitled");
                }}
                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="truncate text-lg font-semibold">{scan.title || "Untitled"}</div>
          )}

          <div className="mt-1 text-xs text-white/60">
            {scan.type === "text" ? "Text scan" : "Image scan"} •{" "}
            {new Date(scan.created_at).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Rename
            </button>
          )}
          <button
            onClick={async () => onDelete(scan.id)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        {scan.type === "text" ? (
          <div className="text-sm text-white/85">
            {scan.text_preview ? (
              <div className="line-clamp-6 whitespace-pre-wrap">{scan.text_preview}</div>
            ) : (
              <div className="text-white/40">No preview.</div>
            )}
          </div>
        ) : scan.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scan.image_url}
            alt="scan"
            className="max-h-56 w-full rounded-xl object-contain"
          />
        ) : (
          <div className="text-sm text-white/40">No image preview.</div>
        )}
      </div>
    </div>
  );
}

export default function ScansClient({ filterType }: { filterType: "text" | "image" }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const title = filterType === "text" ? "Saved Text Scans" : "Saved Image Scans";
  const nextPath = filterType === "text" ? "/scans/text" : "/scans/image";

  const placeholders = useMemo(() => {
    const missing = Math.max(0, 6 - (isAuthed ? scans.length : 0));
    return Array.from({ length: missing });
  }, [scans.length, isAuthed]);

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function loadScans() {
    setErr(null);
    setLoading(true);

    try {
      const token = await getAccessToken();

      // Not logged in -> do NOT redirect. Just show empty placeholders.
      if (!token) {
        if (!mountedRef.current) return;
        setIsAuthed(false);
        setScans([]);
        return;
      }

      const res = await fetch(`/api/scans?type=${filterType}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));

      if (res.status === 401) {
        if (!mountedRef.current) return;
        setIsAuthed(false);
        setScans([]);
        return;
      }

      if (!res.ok) throw new Error(j?.error || `Request failed (${res.status})`);

      if (!mountedRef.current) return;
      setScans(Array.isArray(j.scans) ? j.scans : []);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setErr(e?.message || "Failed to load scans.");
      setScans([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }

  async function renameScan(id: string, nextTitle: string) {
    setErr(null);

    const token = await getAccessToken();
    if (!token) {
      setIsAuthed(false);
      return;
    }

    const res = await fetch(`/api/scans`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, title: nextTitle }),
    });

    const j = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setIsAuthed(false);
      setScans([]);
      return;
    }
    if (!res.ok) throw new Error(j?.error || `Rename failed (${res.status})`);

    setScans((prev) => prev.map((s) => (s.id === id ? { ...s, title: nextTitle } : s)));
  }

  async function deleteScan(id: string) {
    setErr(null);

    const token = await getAccessToken();
    if (!token) {
      setIsAuthed(false);
      return;
    }

    const res = await fetch("/api/scans", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const j = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setIsAuthed(false);
      setScans([]);
      return;
    }
    if (!res.ok) throw new Error(j?.error || `Delete failed (${res.status})`);

    setScans((prev) => prev.filter((s) => s.id !== id));
  }

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const token = await getAccessToken();
      setIsAuthed(!!token);
      setSessionReady(true);

      if (token) await loadScans();
      else setScans([]);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const authed = !!session?.access_token;
      setIsAuthed(authed);
      if (authed) await loadScans();
      else setScans([]);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-white/60">
              {isAuthed ? "Manage your saved scans." : "Log in to view and manage saved scans."}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!sessionReady ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                Checking…
              </div>
            ) : isAuthed ? (
              <button
                onClick={loadScans}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                Log in
              </Link>
            )}
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {err}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isAuthed &&
            scans.map((scan) => (
              <ScanCard key={scan.id} scan={scan} onRename={renameScan} onDelete={deleteScan} />
            ))}

          {placeholders.map((_, i) => (
            <DashedCard key={`empty-${i}`} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
