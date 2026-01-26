"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type HL = { text: string; label: "ai" | "human" | "unsure"; score?: number };

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

// Winston sometimes returns 0.41 (fraction) instead of 41 (percent)
function normalizeAiPercent(x: any): number | null {
  if (x == null) return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return clamp(pct, 0, 100);
}

function AiRing({ aiPercent }: { aiPercent: number }) {
  const p = clamp(aiPercent, 0, 100);
  const deg = (p / 100) * 360;
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-16 w-16 rounded-full border border-white/10 bg-black/30"
        style={{
          background: `conic-gradient(white ${deg}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
        aria-label={`AI ${p.toFixed(0)}%`}
        title={`AI ${p.toFixed(0)}%`}
      />
      <div className="text-sm">
        <div className="text-white/80">
          AI <span className="text-white font-medium">{p.toFixed(0)}%</span>
        </div>
        <div className="text-white/50">Human {(100 - p).toFixed(0)}%</div>
      </div>
    </div>
  );
}

function legendPill(cls: string, text: string) {
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{text}</span>;
}

function classForLabel(label: HL["label"]) {
  if (label === "ai") return "bg-red-500/15 border border-red-500/25 text-red-100";
  if (label === "unsure") return "bg-yellow-500/15 border border-yellow-500/25 text-yellow-100";
  return "bg-green-500/15 border border-green-500/25 text-green-100";
}

/**
 * Tries to read highlight/sentence data from whatever shape you have saved in `result`.
 * Supports common shapes:
 * - result.sentences: [{ text, label/klass/type, score }]
 * - result.highlights: [{ text, label }]
 * - result.segments: [{ text, label }]
 * If nothing exists, returns [].
 */
function extractHighlights(result: any, fallbackText: string): HL[] {
  const pickLabel = (raw: any): HL["label"] => {
    const s = String(raw ?? "").toLowerCase();
    if (s.includes("ai") || s.includes("machine")) return "ai";
    if (s.includes("unsure") || s.includes("mixed") || s.includes("maybe")) return "unsure";
    if (s.includes("human")) return "human";
    // If score exists and is numeric, guess label
    return "human";
  };

  const tryArrays = [
    result?.sentences,
    result?.highlights,
    result?.segments,
    result?.data?.sentences,
    result?.data?.highlights,
  ];

  for (const arr of tryArrays) {
    if (Array.isArray(arr) && arr.length) {
      const out: HL[] = arr
        .map((s: any) => {
          const text = typeof s?.text === "string" ? s.text : typeof s === "string" ? s : "";
          if (!text.trim()) return null;

          const label = pickLabel(s?.label ?? s?.type ?? s?.class ?? s?.klass ?? s?.prediction);
          const scoreNum = s?.score ?? s?.prob ?? s?.probability ?? s?.ai ?? null;
          const score = scoreNum != null && Number.isFinite(Number(scoreNum)) ? Number(scoreNum) : undefined;

          return { text, label, score };
        })
        .filter(Boolean) as HL[];

      if (out.length) return out;
    }
  }

  // No highlight structure saved
  if (!fallbackText?.trim()) return [];
  return [];
}

export default function ScanTextDetailClient({ id }: { id: string }) {
  const [scan, setScan] = useState<any>(null);
  const [aiPercent, setAiPercent] = useState<number | null>(null);
  const [highlights, setHighlights] = useState<HL[]>([]);

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

      const ap = normalizeAiPercent(row?.ai_percent ?? row?.result?.aiPercent ?? row?.result?.ai_percent ?? null);
      setAiPercent(ap);

      const textVal = typeof row?.text === "string" ? row.text : "";
      const hl = extractHighlights(row?.result, textVal);
      setHighlights(hl);

      if (lastLoadedId.current !== row?.id) {
        lastLoadedId.current = row?.id ?? null;
        setDraft(textVal);
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

  // (Optional) keep your rescan button as-is, but normalize aiPercent before saving so you never get 0.41 -> int errors
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

      const nextAi = normalizeAiPercent(j.aiPercent);
      setAiPercent(nextAi);

      const save = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: textToScan,
          result: j,
          ai_percent: nextAi == null ? null : Math.round(nextAi), // store int percent
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
            <div className="mb-3 text-sm font-medium">Input</div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-90 w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none"
            />
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-medium">Result</div>

            {aiPercent == null ? (
              <div className="mt-3 text-sm text-white/50">No score saved yet.</div>
            ) : (
              <div className="mt-3">
                <AiRing aiPercent={aiPercent} />
              </div>
            )}

            <div className="mt-5">
              <div className="text-xs text-white/70">Highlight legend</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {legendPill("bg-red-500/15 border border-red-500/25 text-red-100", "Red: likely AI")}
                {legendPill("bg-yellow-500/15 border border-yellow-500/25 text-yellow-100", "Yellow: unsure")}
                {legendPill("bg-green-500/15 border border-green-500/25 text-green-100", "Green: likely human")}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
              {highlights.length === 0 ? (
                <div className="text-sm text-white/50">
                  No highlight data saved for this scan.
                  <div className="mt-1 text-xs text-white/40">
                    (If you want highlights here, your /api/scans save must store the full result object with sentence data.)
                  </div>
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                  {highlights.map((h, idx) => (
                    <div key={idx} className={`rounded-xl px-3 py-2 text-sm ${classForLabel(h.label)}`}>
                      {h.text}
                    </div>
                  ))}
                </div>
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
