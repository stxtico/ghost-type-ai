"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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

function getAiPercentFromScan(scan: any): number | null {
  if (!scan) return null;
  if (typeof scan.ai_percent === "number") return clamp(scan.ai_percent);
  if (typeof scan?.result?.aiPercent === "number") return clamp(scan.result.aiPercent);
  if (typeof scan?.result?.humanScore === "number") return clamp(100 - scan.result.humanScore);
  return null;
}

export default function ScanImageDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function load() {
    setErr(null);
    setLoading(true);

    try {
      const token = await getAccessToken();
      setIsAuthed(!!token);
      setSessionReady(true);

      if (!token) {
        setScan(null);
        setErr("Please log in to view this scan.");
        return;
      }

      const res = await fetch(`/api/scans?id=${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Request failed (${res.status})`);

      if (!alive.current) return;
      setScan(j.scan);
    } catch (e: any) {
      if (!alive.current) return;
      setErr(e?.message || "Failed to load scan.");
    } finally {
      if (!alive.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const aiPct = useMemo(() => getAiPercentFromScan(scan), [scan]);

  async function rename() {
    if (!scan) return;
    setActionMsg(null);
    setActionLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not logged in.");

      const next = window.prompt("Rename scan:", scan.title || "Untitled");
      if (next == null) return;

      const res = await fetch("/api/scans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: scan.id, title: next }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rename failed (${res.status})`);

      setScan((s: any) => ({ ...(s || {}), title: next }));
      setActionMsg("Renamed.");
    } catch (e: any) {
      setActionMsg(e?.message || "Rename failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function del() {
    if (!scan) return;
    if (!window.confirm("Delete this scan?")) return;

    setActionMsg(null);
    setActionLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not logged in.");

      const res = await fetch("/api/scans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: scan.id }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Delete failed (${res.status})`);

      setActionMsg("Deleted.");
      router.push("/scans/image");
    } catch (e: any) {
      setActionMsg(e?.message || "Delete failed.");
    } finally {
      setActionLoading(false);
    }
  }

  // Rescan: re-fetch the image as a blob from image_url, send it back to /api/detect-image
  async function rescan() {
    if (!scan) return;

    setActionMsg(null);
    setActionLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not logged in.");

      const imageUrl = scan.image_url;
      if (!imageUrl) throw new Error("No image_url available to rescan.");

      // download the image into a blob
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("Failed to fetch image for rescan.");
      const blob = await imgRes.blob();

      const fd = new FormData();
      fd.append("image", blob, "scan.jpg");

      const res = await fetch("/api/detect-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rescan failed (${res.status})`);

      // save result back onto scan row
      const upd = await fetch("/api/scans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: scan.id,
          result: j,
          ai_percent: typeof j?.aiPercent === "number" ? j.aiPercent : undefined,
        }),
      });

      const uj = await upd.json().catch(() => ({}));
      if (!upd.ok) throw new Error(uj?.error || `Save result failed (${upd.status})`);

      setScan((s: any) => ({ ...(s || {}), result: j, ai_percent: j.aiPercent ?? s?.ai_percent }));
      setActionMsg("Rescanned + saved.");
    } catch (e: any) {
      setActionMsg(e?.message || "Rescan failed.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Image Scan</div>
            <div className="mt-1 text-sm text-white/60">
              {sessionReady ? (isAuthed ? "Manage your saved image scan." : "Log in required.") : "Checking…"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/scans/image")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Loading…
          </div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {err}
          </div>
        ) : !scan ? null : (
          <div className="grid gap-4 md:grid-cols-[1fr_320px]">
            {/* main */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-white">{scan.title || "Untitled"}</div>
                  <div className="mt-1 text-xs text-white/60">
                    {scan.created_at ? new Date(scan.created_at).toLocaleString() : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={rename}
                    disabled={actionLoading}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    Rename
                  </button>

                  <button
                    onClick={rescan}
                    disabled={actionLoading}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
                  >
                    {actionLoading ? "Working…" : "Rescan + save"}
                  </button>

                  <button
                    onClick={del}
                    disabled={actionLoading}
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/15 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                {scan.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={scan.image_url}
                    alt="scan"
                    className="max-h-130 w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="text-sm text-white/50">No image URL available.</div>
                )}
              </div>

              {actionMsg && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                  {actionMsg}
                </div>
              )}
            </section>

            {/* sidebar */}
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-medium text-white">AI detected</div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-24 w-24 rounded-full" style={donutStyle(aiPct ?? 0)}>
                  <div className="absolute inset-3 rounded-full border border-white/10 bg-black/85" />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                    {aiPct == null ? "—" : `${aiPct.toFixed(0)}%`}
                  </div>
                </div>

                <div className="text-sm text-white/75">
                  <div className="text-white/60">AI</div>
                  <div className="text-white">{aiPct == null ? "Unknown" : `${aiPct.toFixed(0)}%`}</div>
                  <div className="mt-2 text-white/60">Human</div>
                  <div className="text-white">{aiPct == null ? "Unknown" : `${(100 - aiPct).toFixed(0)}%`}</div>
                </div>
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer text-xs text-white/60 hover:text-white">
                  Show raw result
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-white/90">
                  {JSON.stringify(scan.result ?? null, null, 2)}
                </pre>
              </details>
            </aside>
          </div>
        )}
      </main>
    </AppShell>
  );
}
