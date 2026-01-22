"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";

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
  onRename: (id: string, nextTitle: string) => void;
  onDelete: (id: string) => void;
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
                onClick={() => {
                  setEditing(false);
                  onRename(scan.id, title.trim() || "Untitled");
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
            onClick={() => onDelete(scan.id)}
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
          <img src={scan.image_url} alt="scan" className="max-h-56 w-full rounded-xl object-contain" />
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

  const filtered = useMemo(() => scans.filter((s) => s.type === filterType), [scans, filterType]);

  const placeholders = useMemo(() => {
    const missing = Math.max(0, 6 - filtered.length);
    return Array.from({ length: missing });
  }, [filtered.length]);

  function loginRedirect() {
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?next=${next}`;
  }

  async function loadScans() {
    setErr(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        loginRedirect();
        return;
      }

      const res = await fetch("/api/scans", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Request failed (${res.status})`);

      setScans(Array.isArray(j.scans) ? j.scans : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load scans.");
    } finally {
      setLoading(false);
    }
  }

  async function renameScan(id: string, nextTitle: string) {
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) return loginRedirect();

      const res = await fetch("/api/scans", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id, title: nextTitle }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rename failed (${res.status})`);

      setScans((prev) => prev.map((s) => (s.id === id ? { ...s, title: nextTitle } : s)));
    } catch (e: any) {
      setErr(e?.message || "Rename failed.");
    }
  }

  async function deleteScan(id: string) {
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) return loginRedirect();

      const res = await fetch("/api/scans", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Delete failed (${res.status})`);

      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    }
  }

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const authed = !!data.session;
      setIsAuthed(authed);
      setSessionReady(true);

      if (!authed) {
        loginRedirect();
        return;
      }

      await loadScans();

      const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
        const nowAuthed = !!session;
        setIsAuthed(nowAuthed);
        if (!nowAuthed) loginRedirect();
        else await loadScans();
      });

      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = filterType === "text" ? "Saved Text Scans" : "Saved Image Scans";

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-white/60">Manage your saved scans.</div>
          </div>

          <button
            onClick={loadScans}
            disabled={!sessionReady || !isAuthed || loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {err && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {err}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((scan) => (
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
