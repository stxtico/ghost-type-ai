"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import TokenBar from "@/components/TokenBar";

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

// Donut using CSS conic-gradient (no libs)
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

export default function DetectImagePage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [usage, setUsage] = useState<{ used: number; limit: number; unit?: string } | null>(null);
  const [usageErr, setUsageErr] = useState<string | null>(null);

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
      body: JSON.stringify({ tool: "detect_image" }),
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
      unit: String(j.unit ?? "images"),
    });
  }

  // auth state
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

  // local preview
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function runScan() {
    setErr(null);
    setSaveMsg(null);
    setResult(null);

    if (!isAuthed) {
      window.location.href = "/login";
      return;
    }
    if (!file) {
      setErr("Choose an image first.");
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

      const fd = new FormData();
      fd.append("image", file);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45000);

      const res = await fetch("/api/detect-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout));

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);

      if (!alive.current) return;

      setResult(json);
      await refreshUsage();
    } catch (e: any) {
      const msg =
        e?.name === "AbortError"
          ? "Image scan timed out. Try a smaller image or try again."
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

  if (!file || !result) {
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

    const title = `Image scan • ${new Date().toLocaleString()}`;

    // Upload to Storage bucket "scan-images"
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${u.user.id}/${Date.now()}-${safeName}`;

    const up = await supabase.storage.from("scan-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) throw up.error;

    // Create a URL for saving in DB.
    // If your bucket is PUBLIC, getPublicUrl works.
    // If it’s PRIVATE, you should store the path instead (but your table has image_url).
    const pub = supabase.storage.from("scan-images").getPublicUrl(path);
    const imageUrl = pub.data.publicUrl;

    const { error } = await supabase.from("scans").insert({
      user_id: u.user.id,
      kind: "image",
      title,
      image_url: imageUrl,
      preview_image_url: imageUrl,
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
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">AI Detector (Image)</div>
            <div className="mt-1 text-sm text-white/60">
              Upload an image to analyze. Viewing is public; running requires login.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70">
              {sessionReady ? (isAuthed ? "Logged in" : "Guest") : "Checking…"}
            </div>

            <div className="flex items-center gap-2">
              <button type="button"
                onClick={runScan}
                disabled={loading}
                className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Scanning…" : "Scan"}
              </button>

              <button  type="button"
                onClick={saveScan}
                disabled={saveLoading || !result || !file}
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
                label="Image Detector Tokens"
                used={usage.used}
                limit={usage.limit}
                unit={(usage.unit as any) || "images"}
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
              <div className="text-sm font-medium">Upload</div>
              <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                Choose file
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-h-85 w-full rounded-xl object-contain"
                />
              ) : (
                <div className="text-sm text-white/40">Choose an image to preview it here.</div>
              )}
            </div>

            {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 text-sm font-medium">Result</div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              {!result ? (
                <div className="text-sm text-white/40">
                  Results will appear here after you run a scan.
                </div>
              ) : (
                <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
  <div className="mb-3 flex items-center justify-between">
    <div className="text-sm font-medium">Result</div>
    {result?.aiPercent != null && result?.humanScore != null && (
      <div className="text-xs text-white/60">
        AI <span className="text-white/90">{Number(result.aiPercent).toFixed(0)}%</span> • Human{" "}
        <span className="text-white/90">{Number(result.humanScore).toFixed(0)}%</span>
      </div>
    )}
  </div>

  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
    {!result ? (
      <div className="text-sm text-white/40">Results will appear here after you run a scan.</div>
    ) : (
      <div className="flex items-center gap-6">
        <div
          className="relative h-28 w-28 rounded-full"
          style={donutStyle(Number(result.aiPercent ?? 0))}
        >
          <div className="absolute inset-3 rounded-full border border-white/10 bg-black/85" />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
            {Number(result.aiPercent ?? 0).toFixed(0)}%
          </div>
        </div>

        <div className="text-sm text-white/75">
          <div className="mb-2 font-medium text-white/90">AI Likelihood</div>
          <div className="space-y-1">
            <div>
              <span className="text-white/50">AI:</span>{" "}
              <span className="text-white">{Number(result.aiPercent ?? 0).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-white/50">Human:</span>{" "}
              <span className="text-white">{Number(result.humanScore ?? 0).toFixed(0)}%</span>
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-white/60 hover:text-white">
              Show raw response
            </summary>
            <pre className="mt-2 max-h-52 overflow-auto rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white/90">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )}
  </div>
</section>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
