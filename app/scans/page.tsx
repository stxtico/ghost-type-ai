"use client";

import { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ScanRow = {
  id: string;
  kind: "text" | "image";
  title: string | null;
  created_at: string;
  preview_text: string | null;
  preview_image_url: string | null;
};

export default function ScansPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [tab, setTab] = useState<"text" | "image">("text");
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load(kind: "text" | "image") {
    setErr(null);
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setAuthed(false);
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`/api/scans?kind=${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Request failed (${res.status})`);

      setRows(Array.isArray(j.rows) ? j.rows : []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load scans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const ok = !!data.session;
      setAuthed(ok);
      setReady(true);
      if (!ok) {
        window.location.href = "/login";
        return;
      }
      await load(tab);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authed) load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Saved Scans</div>
            <div className="mt-1 text-sm text-white/60">Your saved text & image scans.</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("text")}
              className={`rounded-xl border px-4 py-2 text-sm ${
                tab === "text"
                  ? "border-white/20 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setTab("image")}
              className={`rounded-xl border px-4 py-2 text-sm ${
                tab === "image"
                  ? "border-white/20 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              Image
            </button>

            <Link
              href={tab === "text" ? "/detect/text" : "/detect/image"}
              className="ml-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              New {tab === "text" ? "Text" : "Image"} Scan
            </Link>
          </div>
        </div>

        {!ready ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Checking…
          </div>
        ) : !authed ? null : (
          <>
            {err && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                {err}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="h-4 w-2/3 rounded bg-white/10" />
                    <div className="mt-3 h-24 rounded bg-white/5" />
                  </div>
                ))
              ) : rows.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-6 text-sm text-white/40"
                  >
                    Empty slot
                  </div>
                ))
              ) : (
                rows.slice(0, 12).map((r) => (
                  <div key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">
                        {r.title?.trim() ? r.title : "Untitled"}
                      </div>
                      <div className="text-xs text-white/50">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {r.kind === "text" ? (
                      <div className="mt-3 line-clamp-5 rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white/80">
                        {r.preview_text || "No preview"}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                        {r.preview_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.preview_image_url}
                            alt="preview"
                            className="h-40 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-40 w-full rounded-xl bg-white/5" />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
