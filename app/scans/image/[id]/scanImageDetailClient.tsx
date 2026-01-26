"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function normalizeAiPercent(x: any): number | null {
  if (x == null) return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return clamp(pct, 0, 100);
}

function Donut({ aiPercent }: { aiPercent: number }) {
  const p = clamp(aiPercent, 0, 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm font-semibold text-white">{p.toFixed(0)}%</div>
          </div>
        </div>

        <div className="text-sm text-white/80">
          <div className="font-medium text-white">AI {p.toFixed(0)}%</div>
          <div className="text-white/55">Human {(100 - p).toFixed(0)}%</div>
        </div>
      </div>

      <div className="text-xs text-white/70">
        AI {p.toFixed(0)}% • Human {(100 - p).toFixed(0)}%
      </div>
    </div>
  );
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
      if (!id || id === "undefined") throw new Error("Missing scan id (routing issue).");

      const token = await getToken();
      if (!token) {
        window.location.href = `/login?next=${encodeURIComponent(`/scans/image/${id}`)}`;
        return;
      }

      // IMPORTANT:
      // /api/scans/[id] does NOT sign storage URLs.
      // /api/scans?id=... DOES sign image_url (your list/open API route).
      const res = await fetch(`/api/scans?id=${encodeURIComponent(id)}&kind=image`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Load failed (${res.status})`);

      const row = j?.scan ?? j;

      setScan(row);
      setImageUrl(row?.image_url ?? null);

      const ap = normalizeAiPercent(row?.ai_percent ?? row?.result?.aiPercent ?? row?.result?.ai_percent ?? null);
      setAiPercent(ap);
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  return (
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
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">Loading…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 text-sm font-medium">Image</div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="scan"
                  className="max-h-130 w-full rounded-xl object-contain"
                />
              ) : (
                <div className="text-sm text-white/50">
                  No image preview available (image_url is null).
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Result</div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              {aiPercent == null ? (
                <div className="text-sm text-white/50">No score saved yet.</div>
              ) : (
                <Donut aiPercent={aiPercent} />
              )}
            </div>

            <div className="mt-6 text-xs text-white/60">
              Created: {scan?.created_at ? new Date(scan.created_at).toLocaleString() : "—"}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
