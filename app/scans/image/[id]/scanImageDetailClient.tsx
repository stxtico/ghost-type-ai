"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function clamp(n: number, a =0, b =100) {
  return Math.max(a, Math.min(b, n));
}

function donutStyle(aiPercent: number) {
  const p = clamp(aiPercent, 0, 100);
  return {
    background: `conic-gradient(
      rgba(239,68,68,0.95) 0%,
      rgba(239,68,68,0.95) ${p}%,
      rgba(255,255,255,0.10) ${p}%,
      rgba(255,255,255,0.10) 100%
    )`,
  } as React.CSSProperties;
}

export default function ScanImageDetailClient({ id }: { id: string }) {
  const [scan, setScan] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [aiPercent, setAiPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function load() {
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      if (!id || id === "undefined") {
        throw new Error("Missing scan id (routing issue).");
      }

      const token = await getToken();
      if (!token) {
        window.location.href = `/login?next=${encodeURIComponent(`/scans/image/${id}`)}`;
        return;
      }

      // ✅ OPEN scan by id
      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Load failed (${res.status})`);

      setScan(j);
      setImageUrl(j?.image_url ?? null);

      const ap = j?.ai_percent ?? j?.result?.aiPercent ?? null;
      setAiPercent(ap != null ? Number(ap) : null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load scan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function rename() {
    setErr(null);
    setMsg(null);

    const next = window.prompt("Rename:", scan?.title || "Untitled");
    if (next == null) return;

    const token = await getToken();
    if (!token) return;

    setWorking(true);
    try {
      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: next }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rename failed (${res.status})`);

      setMsg("Renamed.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Rename failed.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteScan() {
    setErr(null);
    setMsg(null);

    const token = await getToken();
    if (!token) return;

    if (!window.confirm("Delete this scan?")) return;

    setWorking(true);
    try {
      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Delete failed (${res.status})`);

      window.location.href = "/scans/image";
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    } finally {
      setWorking(false);
    }
  }

  async function rescanExisting() {
    setErr(null);
    setMsg(null);

    const token = await getToken();
    if (!token) return;

    if (!imageUrl) {
      setErr("No image_url found for this scan.");
      return;
    }

    setWorking(true);
    try {
      const imgRes = await fetch(imageUrl, { cache: "no-store" });
      if (!imgRes.ok) throw new Error("Could not download stored image.");
      const blob = await imgRes.blob();

      const form = new FormData();
      form.append("image", blob, "scan.jpg");

      const res = await fetch("/api/detect-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rescan failed (${res.status})`);

      const nextAi = typeof j.aiPercent === "number" ? j.aiPercent : null;
      setAiPercent(nextAi);

      const save = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          result: j,
          ai_percent: nextAi ?? null,
        }),
      });

      const sj = await save.json().catch(() => ({}));
      if (!save.ok) throw new Error(sj?.error || `Save failed (${save.status})`);

      setMsg("Rescanned + saved.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Rescan failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Saved Image Scan</div>
            <div className="mt-1 text-sm text-white/60">
              <Link className="underline hover:opacity-80" href="/scans/image">
                Back to list
              </Link>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={rename}
              disabled={working || loading}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              Rename
            </button>
            <button
              onClick={rescanExisting}
              disabled={working || loading}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
            >
              Rescan
            </button>
            <button
              onClick={deleteScan}
              disabled={working || loading}
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {msg}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
            Loading…
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 text-sm font-medium">Image</div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="scan"
                    className="max-h-130 w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="text-sm text-white/50">No image preview.</div>
                )}
              </div>
            </section>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-medium">AI %</div>

              {aiPercent == null ? (
                <div className="mt-3 text-sm text-white/50">No score saved yet.</div>
              ) : (
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full" style={donutStyle(aiPercent)}>
                    <div className="absolute inset-3 rounded-full border border-white/10 bg-black/85" />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                      {aiPercent.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-sm text-white/75">
                    <div>AI: {aiPercent.toFixed(0)}%</div>
                    <div>Human: {(100 - aiPercent).toFixed(0)}%</div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-xs text-white/60">
                Created: {scan?.created_at ? new Date(scan.created_at).toLocaleString() : "—"}
              </div>
            </aside>
          </div>
        )}
      </main>
    </AppShell>
  );
}
