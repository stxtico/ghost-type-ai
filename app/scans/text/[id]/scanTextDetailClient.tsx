"use client";

import React, { useEffect, useRef, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function AiBar({ aiPercent }: { aiPercent: number }) {
  const p = clamp(aiPercent, 0, 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>AI</span>
        <span className="text-white">{p.toFixed(0)}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${p}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-white/55">
        <span>Human {(100 - p).toFixed(0)}%</span>
        <span>AI {p.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function ScanTextDetailClient({ id }: { id: string }) {
  const [scan, setScan] = useState<any>(null);
  const [aiPercent, setAiPercent] = useState<number | null>(null);

  const [draft, setDraft] = useState<string>("");
  const lastLoadedId = useRef<string | null>(null);

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
        window.location.href = `/login?next=${encodeURIComponent(`/scans/text/${id}`)}`;
        return;
      }

      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Load failed (${res.status})`);

      const row = j?.scan ?? j;

      setScan(row);
      const ap = row?.ai_percent ?? row?.result?.aiPercent ?? null;
      setAiPercent(ap != null ? Number(ap) : null);

      if (lastLoadedId.current !== row?.id) {
        lastLoadedId.current = row?.id ?? null;
        setDraft(typeof row?.text === "string" ? row.text : "");
      }
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

  async function saveEdits() {
    setErr(null);
    setMsg(null);

    const token = await getToken();
    if (!token) return;

    setWorking(true);
    try {
      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: draft }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Save failed (${res.status})`);

      setMsg("Saved.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Save failed.");
    } finally {
      setWorking(false);
    }
  }

  async function rescanText() {
    setErr(null);
    setMsg(null);

    const token = await getToken();
    if (!token) return;

    const textToScan = (draft ?? "").trim();
    if (!textToScan) {
      setErr("Nothing to rescan (text is empty).");
      return;
    }

    setWorking(true);
    try {
      const res = await fetch("/api/detect-text", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: textToScan }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rescan failed (${res.status})`);

      const nextAi = typeof j.aiPercent === "number" ? j.aiPercent : null;
      setAiPercent(nextAi);

      const save = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: textToScan,
          result: j,
          ai_percent: nextAi,
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

      window.location.href = "/scans/text";
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Saved Text Scan</div>
            <div className="mt-1 text-sm text-white/60">
              <Link className="underline hover:opacity-80" href="/scans/text">
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
              onClick={rescanText}
              disabled={working || loading}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
            >
              Rescan
            </button>
            <button
              onClick={saveEdits}
              disabled={working || loading}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              Save
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
              <div className="mb-3 text-sm font-medium">Text</div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-90 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none"
              />
            </section>

            <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-medium">AI Score</div>
              {aiPercent == null ? (
                <div className="mt-3 text-sm text-white/50">No score saved yet.</div>
              ) : (
                <AiBar aiPercent={aiPercent} />
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
