"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ScanRow = {
  id: string;
  title: string | null;
  type: "text" | "image";
  text_preview: string | null;
  image_url: string | null;
  created_at: string;
};

type ScanDetail = any;

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

function DashedCard() {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/3 p-6">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-3 h-3 w-40 rounded bg-white/5" />
      <div className="mt-6 h-24 rounded-2xl bg-white/5" />
    </div>
  );
}

function ScanCard({
  scan,
  onOpen,
  onRename,
  onDelete,
}: {
  scan: ScanRow;
  onOpen: (id: string) => void;
  onRename: (id: string, nextTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(scan.title || "Untitled");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full max-w-60 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
              <button
                onClick={async () => {
                  setEditing(false);
                  await onRename(scan.id, title.trim() || "Untitled");
                }}
                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="truncate text-lg font-semibold">{scan.title || "Untitled"}</div>
          )}

          <div className="mt-1 text-xs text-white/60">
            {scan.type === "text" ? "Text scan" : "Image scan"} •{" "}
            {new Date(scan.created_at).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpen(scan.id)}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Open
          </button>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Rename
            </button>
          )}
          <button
            onClick={async () => onDelete(scan.id)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        {scan.type === "text" ? (
          <div className="text-sm text-white/85">
            {scan.text_preview ? (
              <div className="line-clamp-6 whitespace-pre-wrap">{scan.text_preview}</div>
            ) : (
              <div className="text-white/40">No preview.</div>
            )}
          </div>
        ) : scan.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scan.image_url} alt="scan" className="h-[220px] w-full rounded-xl object-contain" />
        ) : (
          <div className="text-sm text-white/40">No image preview.</div>
        )}
      </div>
    </div>
  );
}

export default function ScansClient({ filterType }: { filterType: "text" | "image" }) {
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // modal
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  // edit/rescan
  const [editText, setEditText] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const mountedRef = useRef(true);

  const title = filterType === "text" ? "Saved Text Scans" : "Saved Image Scans";
  const nextPath = filterType === "text" ? "/scans/text" : "/scans/image";

  const placeholders = useMemo(() => {
    const missing = Math.max(0, 6 - (isAuthed ? scans.length : 0));
    return Array.from({ length: missing });
  }, [scans.length, isAuthed]);

  async function getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function loadScans() {
    setErr(null);
    setLoading(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        if (!mountedRef.current) return;
        setIsAuthed(false);
        setScans([]);
        return;
      }

      const res = await fetch(`/api/scans?type=${filterType}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const j = await res.json().catch(() => ({}));

      if (res.status === 401) {
        if (!mountedRef.current) return;
        setIsAuthed(false);
        setScans([]);
        return;
      }

      if (!res.ok) throw new Error(j?.error || `Request failed (${res.status})`);

      if (!mountedRef.current) return;
      setScans(Array.isArray(j.scans) ? j.scans : []);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setErr(e?.message || "Failed to load scans.");
      setScans([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }

  async function renameScan(id: string, nextTitle: string) {
    setErr(null);

    const token = await getAccessToken();
    if (!token) {
      setIsAuthed(false);
      return;
    }

    const res = await fetch(`/api/scans`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, title: nextTitle }),
    });

    const j = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setIsAuthed(false);
      setScans([]);
      return;
    }
    if (!res.ok) throw new Error(j?.error || `Rename failed (${res.status})`);

    setScans((prev) => prev.map((s) => (s.id === id ? { ...s, title: nextTitle } : s)));
    if (detail?.id === id) setDetail((d: any) => ({ ...(d || {}), title: nextTitle }));
  }

  async function deleteScan(id: string) {
    setErr(null);

    const token = await getAccessToken();
    if (!token) {
      setIsAuthed(false);
      return;
    }

    const res = await fetch("/api/scans", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const j = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setIsAuthed(false);
      setScans([]);
      return;
    }
    if (!res.ok) throw new Error(j?.error || `Delete failed (${res.status})`);

    setScans((prev) => prev.filter((s) => s.id !== id));
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
    }
  }

  async function openScan(id: string) {
    setOpenId(id);
    setDetail(null);
    setDetailErr(null);
    setActionMsg(null);
    setActionLoading(false);
    setDetailLoading(true);

    const token = await getAccessToken();
    if (!token) {
      setIsAuthed(false);
      setDetailLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/scans?id=${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Open failed (${res.status})`);

      const s = j?.scan || null;
      setDetail(s);

      const fullText =
        (typeof s?.input_text === "string" && s.input_text) ||
        (typeof s?.text === "string" && s.text) ||
        (typeof s?.content === "string" && s.content) ||
        "";

      setEditText(fullText);
    } catch (e: any) {
      setDetailErr(e?.message || "Failed to open scan.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function rescanText() {
    if (!detail) return;
    setActionMsg(null);
    setActionLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not logged in.");

      const res = await fetch("/api/detect-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editText }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Rescan failed (${res.status})`);

      // update detail in UI
      const next = { ...detail, result: j };
      setDetail(next);

      // save back to scans table (prune happens server-side)
      const upd = await fetch("/api/scans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: detail.id,
          input_text: editText,
          result: j,
          ai_percent: typeof j?.aiPercent === "number" ? j.aiPercent : undefined,
        }),
      });

      const uj = await upd.json().catch(() => ({}));
      if (!upd.ok) throw new Error(uj?.error || `Save result failed (${upd.status})`);

      // refresh preview list text_preview
      setScans((prev) =>
        prev.map((s) =>
          s.id === detail.id
            ? { ...s, text_preview: editText.trim().slice(0, 260) }
            : s
        )
      );

      setActionMsg("Rescanned + saved.");
    } catch (e: any) {
      setActionMsg(e?.message || "Rescan failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function saveTextEditsOnly() {
    if (!detail) return;
    setActionMsg(null);
    setActionLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not logged in.");

      const upd = await fetch("/api/scans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: detail.id, input_text: editText, text: editText }),
      });

      const uj = await upd.json().catch(() => ({}));
      if (!upd.ok) throw new Error(uj?.error || `Save failed (${upd.status})`);

      setScans((prev) =>
        prev.map((s) =>
          s.id === detail.id ? { ...s, text_preview: editText.trim().slice(0, 260) } : s
        )
      );

      setActionMsg("Saved text.");
    } catch (e: any) {
      setActionMsg(e?.message || "Save failed.");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const token = await getAccessToken();
      setIsAuthed(!!token);
      setSessionReady(true);

      if (token) await loadScans();
      else setScans([]);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const authed = !!session?.access_token;
      setIsAuthed(authed);
      if (authed) await loadScans();
      else setScans([]);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const aiPct = getAiPercentFromScan(detail);

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">{title}</div>
            <div className="mt-1 text-sm text-white/60">
              {isAuthed ? "Manage your saved scans." : "Log in to view and manage saved scans."}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!sessionReady ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                Checking…
              </div>
            ) : isAuthed ? (
              <button
                onClick={loadScans}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                Log in
              </Link>
            )}
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {err}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isAuthed &&
            scans.map((scan) => (
              <ScanCard
                key={scan.id}
                scan={scan}
                onOpen={openScan}
                onRename={renameScan}
                onDelete={deleteScan}
              />
            ))}

          {placeholders.map((_, i) => (
            <DashedCard key={`empty-${i}`} />
          ))}
        </div>

        {/* MODAL */}
        {openId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            onClick={() => {
              setOpenId(null);
              setDetail(null);
            }}
          >
            <div
              className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-white">
                    {detail?.title || "Scan"}
                  </div>
                  <div className="mt-1 text-xs text-white/55">
                    {detail?.type || filterType} •{" "}
                    {detail?.created_at ? new Date(detail.created_at).toLocaleString() : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpenId(null)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid gap-0 md:grid-cols-[1fr_320px]">
                {/* main */}
                <div className="p-6">
                  {detailLoading ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      Loading…
                    </div>
                  ) : detailErr ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                      {detailErr}
                    </div>
                  ) : !detail ? null : detail.type === "text" ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-white">Text</div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="h-[360px] w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-white/25"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={saveTextEditsOnly}
                          disabled={actionLoading}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
                        >
                          {actionLoading ? "Saving…" : "Save text"}
                        </button>

                        <button
                          onClick={rescanText}
                          disabled={actionLoading || !editText.trim()}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
                        >
                          {actionLoading ? "Working…" : "Rescan + save"}
                        </button>

                        <button
                          onClick={async () => {
                            const t = window.prompt("Rename:", detail.title || "Untitled");
                            if (t != null) await renameScan(detail.id, t);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                        >
                          Rename
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm("Delete this scan?")) await deleteScan(detail.id);
                          }}
                          className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      </div>

                      {actionMsg && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                          {actionMsg}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-white">Image</div>

                      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                        {detail?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={detail.image_url}
                            alt="scan"
                            className="h-[360px] w-full rounded-xl object-contain"
                          />
                        ) : (
                          <div className="text-sm text-white/50">No image preview found.</div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={async () => {
                            const t = window.prompt("Rename:", detail.title || "Untitled");
                            if (t != null) await renameScan(detail.id, t);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                        >
                          Rename
                        </button>

                        <button
                          onClick={async () => {
                            if (window.confirm("Delete this scan?")) await deleteScan(detail.id);
                          }}
                          className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15"
                        >
                          Delete
                        </button>
                      </div>

                      {actionMsg && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                          {actionMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* sidebar */}
                <div className="border-t border-white/10 p-6 md:border-l md:border-t-0">
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
                      <div className="text-white">
                        {aiPct == null ? "Unknown" : `${(100 - aiPct).toFixed(0)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                    Tip: “AI%” comes from your stored <span className="text-white/90">result.aiPercent</span>{" "}
                    even if your scans table doesn’t have an <span className="text-white/90">ai_percent</span> column.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
