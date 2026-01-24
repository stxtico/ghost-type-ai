"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import TokenBar from "@/components/TokenBar";

type Sent = {
  text: string;
  humanScore: number;
  aiScore: number;
  label: "ai" | "maybe" | "human";
};

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function wordsCount(input: string) {
  const t = input.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function pillFor(label: Sent["label"]) {
  if (label === "ai") return "border-red-400/30 bg-red-500/15 text-red-100";
  if (label === "maybe") return "border-yellow-400/30 bg-yellow-500/15 text-yellow-100";
  return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
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

export default function DetectTextPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [input, setInput] = useState("");

  const [aiPercent, setAiPercent] = useState<number | null>(null);
  const [humanScore, setHumanScore] = useState<number | null>(null);
  const [sentences, setSentences] = useState<Sent[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [usage, setUsage] = useState<{ used: number; limit: number; unit?: string } | null>(null);
  const [usageErr, setUsageErr] = useState<string | null>(null);

  const words = useMemo(() => wordsCount(input), [input]);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function refreshUsage() {
    setUsageErr(null);
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      setUsage(null);
      return;
    }

    const res = await fetch("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ tool: "detect_text" }),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setUsage(null);
      setUsageErr(j?.error || `Token sync failed (${res.status})`);
      return;
    }

    setUsage({
      used: Number(j.used ?? 0),
      limit: Number(j.limit ?? 0),
      unit: String(j.unit ?? "words"),
    });
  }

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const authed = !!data.session;
      if (!alive.current) return;

      setIsAuthed(authed);
      setSessionReady(true);
      if (authed) await refreshUsage();

      const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
        if (!alive.current) return;

        const nowAuthed = !!session;
        setIsAuthed(nowAuthed);
        setSessionReady(true);

        if (nowAuthed) await refreshUsage();
        else {
          setUsage(null);
          setUsageErr(null);
        }
      });

      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runDetect() {
    setErr(null);
    setSaveMsg(null);
    setWarning(null);
    setAiPercent(null);
    setHumanScore(null);
    setSentences([]);

    if (!isAuthed) {
      window.location.href = "/login";
      return;
    }

    if (!input.trim()) {
      setErr("Paste some text first.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/detect-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: input }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout));

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);

      if (!alive.current) return;

      setAiPercent(Number(json.aiPercent ?? 0));
      setHumanScore(Number(json.humanScore ?? 0));
      setSentences(Array.isArray(json.sentences) ? json.sentences : []);
      if (json?.warning) setWarning(String(json.warning));

      await refreshUsage();
    } catch (e: any) {
      const msg =
        e?.name === "AbortError"
          ? "Detect request timed out. Try again."
          : e?.message || "Something went wrong.";
      if (alive.current) setErr(msg);
    } finally {
      if (alive.current) setLoading(false);
    }
  }

  async function saveScan() {
  setSaveMsg(null);

  if (!isAuthed) {
    window.location.href = "/login";
    return;
  }

  if (!input.trim() || aiPercent === null) {
    setSaveMsg("Run a scan first.");
    return;
  }

  setSaveLoading(true);
  try {
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr || !u.user) {
      window.location.href = "/login";
      return;
    }

    const title = `Text scan • ${new Date().toLocaleString()}`;
    const preview = input.trim().slice(0, 220);

    // Match YOUR scans table schema
    const { error } = await supabase.from("scans").insert({
      user_id: u.user.id,
      kind: "text",
      title,
      text: input,
      preview_text: preview,
      // created_at auto
    });

    if (error) throw error;

    setSaveMsg("Saved!");
  } catch (e: any) {
    setSaveMsg(`Save failed: ${e?.message || "Unknown error"}`);
  } finally {
    setSaveLoading(false);
  }
}


  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">AI Detector (Text)</div>
            <div className="mt-1 text-sm text-white/60">
              Paste text to estimate AI probability. Viewing is public; running requires login.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70">
              {sessionReady ? (isAuthed ? "Logged in" : "Guest") : "Checking…"}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runDetect}
                disabled={loading}
                className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Scanning…" : "Scan"}
              </button>

              <button
                onClick={saveScan}
                disabled={saveLoading || aiPercent === null}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                {saveLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {isAuthed && (
          <div className="mb-4">
            {usage ? (
              <TokenBar
                label="Text Detector Tokens"
                used={usage.used}
                limit={usage.limit}
                unit={(usage.unit as any) || "words"}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {usageErr ? `Tokens: ${usageErr}` : "Loading tokens…"}
              </div>
            )}
          </div>
        )}

        {saveMsg && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {saveMsg}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">Input</div>
              <div className="text-xs text-white/60">{words} words</div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text here…"
              className="h-80 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />

            {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
            {warning && <div className="mt-3 text-sm text-yellow-200">{warning}</div>}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">Result</div>
              {aiPercent !== null && humanScore !== null && (
                <div className="text-xs text-white/60">
                  AI <span className="text-white/90">{aiPercent.toFixed(0)}%</span> • Human{" "}
                  <span className="text-white/90">{humanScore.toFixed(0)}%</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              {aiPercent === null ? (
                <div className="text-sm text-white/40">Run a scan to see results.</div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="relative h-28 w-28 rounded-full" style={donutStyle(aiPercent)}>
                    <div className="absolute inset-3 rounded-full border border-white/10 bg-black/85" />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                      {aiPercent.toFixed(0)}%
                    </div>
                  </div>

                  <div className="text-sm text-white/75">
                    <div className="mb-2 font-medium text-white/90">Highlight legend</div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs ${pillFor("ai")}`}>
                        Red: likely AI
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs ${pillFor("maybe")}`}>
                        Yellow: unsure
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs ${pillFor("human")}`}>
                        Green: likely human
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
              {sentences.length === 0 ? (
                <div className="text-sm text-white/40">Sentence highlights will appear here.</div>
              ) : (
                <div className="max-h-60 space-y-2 overflow-auto text-sm">
                  {sentences.map((s, i) => (
                    <div key={i} className={`rounded-xl border px-3 py-2 ${pillFor(s.label)}`}>
                      <div className="text-white/90">{s.text}</div>
                      <div className="mt-1 text-xs opacity-80">
                        AI {clamp(s.aiScore).toFixed(0)}% • Human {clamp(s.humanScore).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
