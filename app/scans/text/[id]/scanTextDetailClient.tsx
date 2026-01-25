"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import TokenBar from "@/components/TokenBar";
import Link from "next/link";

function clamp(n: number, a = 0, b = 100) {
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

export default function ScanTextDetailClient({ id }: { id: string }) {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [aiPercent, setAiPercent] = useState<number | null>(null);
  const [humanScore, setHumanScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [usage, setUsage] = useState<{ used: number; limit: number; unit?: string } | null>(null);
  const [usageErr, setUsageErr] = useState<string | null>(null);

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function refreshUsage() {
    setUsageErr(null);
    const token = await getToken();
    if (!token) {
      setUsage(null);
      return;
    }
    const res = await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tool: "detect_text" }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setUsage(null);
      setUsageErr(j?.error || `Token sync failed (${res.status})`);
      return;
    }
    setUsage({ used: Number(j.used ?? 0), limit: Number(j.limit ?? 0), unit: String(j.unit ?? "words") });
  }

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        window.location.href = `/login?next=${encodeURIComponent(`/scans/text/${id}`)}`;
        return;
      }
      const res = await fetch(`/api/scans?id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Load failed (${res.status})`);

      setScan(j.scan);
      const t = String(j.scan?.text ?? j.scan?.input_text ?? j.scan?.preview_text ?? "");
      setText(t);
      const ap = j.scan?.ai_percent ?? j.scan?.result?.aiPercent ?? null;
      const hs = j.scan?.result?.humanScore ?? null;
      setAiPercent(ap != null ? Number(ap) : null);
      setHumanScore(hs != null ? Number(hs) : null);

      await refreshUsage();
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
    if (!id || id === "undefined") {
    setErr("Missing scan id (page routing issue).");
    return;
    }

  async function rescan() {
    setMsg(null);
    setErr(null);

    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/detect-text", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error || `Rescan failed (${res.status})`);
      return;
    }

    setAiPercent(Number(j.aiPercent ?? 0));
    setHumanScore(Number(j.humanScore ?? 0));

    // Save updated result into DB
    setSaving(true);
    try {
      const patchRes = await fetch("/api/scans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id,
          text,
          preview_text: text.trim().slice(0, 220),
          ai_percent: Number(j.aiPercent ?? 0),
          result: j,
        }),
      });
      const pj = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) throw new Error(pj?.error || `Update failed (${patchRes.status})`);
      setMsg("Rescanned + saved.");
      await refreshUsage();
    } catch (e: any) {
      setMsg(`Rescan saved partially: ${e?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }
    if (!id || id === "undefined") {
  setErr("Missing scan id (page routing issue).");
  return;
}

  async function saveEdits() {
    setMsg(null);
    setErr(null);
    const token = await getToken();
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch("/api/scans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id,
          text,
          preview_text: text.trim().slice(0, 220),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Save failed (${res.status})`);
      setMsg("Saved edits.");
    } catch (e: any) {
      setErr(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteScan() {
    const token = await getToken();
    if (!token) return;
    if (!window.confirm("Delete this scan?")) return;

    const res = await fetch("/api/scans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error || `Delete failed (${res.status})`);
      return;
    }
    window.location.href = "/scans/text";
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Saved Text Scan</div>
            <div className="mt-1 text-sm text-white/60">
              <Link className="underline hover:opacity-80" href="/scans/text">Back to list</Link>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdits}
              disabled={saving || loading}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save edits"}
            </button>
            <button
              onClick={rescan}
              disabled={saving || loading}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
            >
              Rescan
            </button>
            <button
              onClick={deleteScan}
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15"
            >
              Delete
            </button>
          </div>
        </div>

        {usage && (
          <div className="mb-4">
            <TokenBar label="Text Detector Tokens" used={usage.used} limit={usage.limit} unit={(usage.unit as any) || "words"} />
          </div>
        )}
        {usageErr && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            Tokens: {usageErr}
          </div>
        )}

        {err && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{err}</div>}
        {msg && <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{msg}</div>}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">Loading…</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Editor */}
            <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium">Text</div>
                <div className="text-xs text-white/60">{words} words</div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-96 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-white/25"
              />
            </section>

            {/* Sidebar */}
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
                    <div>AI: <span className="text-white">{aiPercent.toFixed(0)}%</span></div>
                    {humanScore != null && (
                      <div>Human: <span className="text-white">{humanScore.toFixed(0)}%</span></div>
                    )}
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
