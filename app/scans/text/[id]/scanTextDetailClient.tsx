"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type HL = { text: string; label: "ai" | "human" | "unsure" };

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function normalizeAiPercent(x: any): number | null {
  if (x == null) return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n; // handle 0.41 => 41
  return clamp(pct, 0, 100);
}

function toIntPercent(x: any): number | null {
  const pct = normalizeAiPercent(x);
  if (pct == null) return null;
  return Math.round(pct);
}

function previewFromText(s: string) {
  return (s ?? "").trim().slice(0, 260);
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
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="8"
            />
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

function legendPill(cls: string, text: string) {
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{text}</span>;
}

function classForLabel(label: HL["label"]) {
  if (label === "ai") return "bg-red-500/15 border border-red-500/25 text-red-100";
  if (label === "unsure") return "bg-yellow-500/15 border border-yellow-500/25 text-yellow-100";
  return "bg-green-500/15 border border-green-500/25 text-green-100";
}

function extractHighlights(result: any): HL[] {
  const pickLabel = (raw: any): HL["label"] => {
    const s = String(raw ?? "").toLowerCase();
    if (s.includes("ai") || s.includes("machine")) return "ai";
    if (s.includes("unsure") || s.includes("mixed") || s.includes("maybe")) return "unsure";
    if (s.includes("human")) return "human";
    return "human";
  };

  const arrays = [
    result?.sentences,
    result?.highlights,
    result?.segments,
    result?.data?.sentences,
    result?.data?.highlights,
  ];

  for (const arr of arrays) {
    if (Array.isArray(arr) && arr.length) {
      const out: HL[] = arr
        .map((s: any) => {
          const text = typeof s?.text === "string" ? s.text : typeof s === "string" ? s : "";
          if (!text.trim()) return null;
          const label = pickLabel(s?.label ?? s?.type ?? s?.class ?? s?.klass ?? s?.prediction);
          return { text, label };
        })
        .filter(Boolean) as HL[];
      if (out.length) return out;
    }
  }

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

      function computeAiPercentInt(row: any): number | null {
  const r = row?.result ?? null;

  // Prefer explicit AI percent
  const a1 = toIntPercent(r?.aiPercent ?? r?.ai_percent ?? null);
  if (a1 != null) return a1;

  // If API returns "human", convert to AI
  const h1 = normalizeAiPercent(r?.humanScore ?? r?.humanPercent ?? r?.human_percent ?? null);
  if (h1 != null) return Math.round(100 - h1);

  // Fallback to stored column
  const a2 = toIntPercent(row?.ai_percent ?? null);
  if (a2 != null) return a2;

  return null;
}

// ...
const ap = computeAiPercentInt(row);
setAiPercent(ap);


      setHighlights(extractHighlights(row?.result));

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

    const nextText = draft ?? "";
    const preview_text = previewFromText(nextText);

    setWorking(true);
    try {
      const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: nextText,
          preview_text, // ✅ keeps list preview up to date
        }),
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

  // ✅ RESCAN (TEXT ONLY)
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

      const nextAiInt = toIntPercent(j?.aiPercent ?? j?.ai_percent ?? null);
      setAiPercent(nextAiInt);
      setHighlights(extractHighlights(j));

      const preview_text = previewFromText(textToScan);

      // Save scan: store integer ai_percent + result payload + preview_text
      const save = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: textToScan,
          preview_text, // ✅ keeps list preview up to date
          result: j,
          ai_percent: nextAiInt, // ✅ integer
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

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              {aiPercent == null ? (
                <div className="text-sm text-white/50">No score saved yet.</div>
              ) : (
                <Donut aiPercent={aiPercent} />
              )}

              <div className="mt-4">
                <div className="text-xs text-white/70">Highlight legend</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {legendPill("bg-red-500/15 border border-red-500/25 text-red-100", "Red: likely AI")}
                  {legendPill("bg-yellow-500/15 border border-yellow-500/25 text-yellow-100", "Yellow: unsure")}
                  {legendPill("bg-green-500/15 border border-green-500/25 text-green-100", "Green: likely human")}
                </div>
              </div>

              <div className="mt-4">
                {highlights.length === 0 ? (
                  <div className="text-sm text-white/50">No highlight data saved for this scan.</div>
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
