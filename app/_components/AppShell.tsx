"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { supabase } from "@/lib/supabaseClient";
import TokenBar from "@/components/TokenBar";

type Unit = "words" | "images";

type BarState = {
  label: string;
  used: number;
  limit: number;
  unit: Unit;
} | null;

function clampInt(n: any, fallback = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(0, Math.floor(x));
}

function extractUsage(payload: any, tool: string): { used: number; limit: number; unit?: Unit } | null {
  if (!payload) return null;

  if (payload.tool === tool && (payload.used != null || payload.limit != null)) {
    return { used: clampInt(payload.used, 0), limit: clampInt(payload.limit, 0), unit: payload.unit };
  }

  const u1 = payload?.usage?.[tool];
  if (u1 && (u1.used != null || u1.limit != null)) {
    return { used: clampInt(u1.used, 0), limit: clampInt(u1.limit, 0), unit: u1.unit };
  }

  const u2 = payload?.tools?.[tool];
  if (u2 && (u2.used != null || u2.limit != null)) {
    return { used: clampInt(u2.used, 0), limit: clampInt(u2.limit, 0), unit: u2.unit };
  }

  const rows = payload?.rows;
  if (Array.isArray(rows)) {
    const row = rows.find((r) => String(r?.tool) === tool);
    if (row) return { used: clampInt(row.words_used ?? row.used, 0), limit: clampInt(row.limit ?? row.monthly_limit, 0), unit: row.unit };
  }

  const data = payload?.data;
  if (Array.isArray(data)) {
    const row = data.find((r) => String(r?.tool) === tool);
    if (row) return { used: clampInt(row.words_used ?? row.used, 0), limit: clampInt(row.limit ?? row.monthly_limit, 0), unit: row.unit };
  }

  return null;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [name, setName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [bar, setBar] = useState<BarState>(null);

  function applyUser(user: any | null) {
    const display =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.email ? String(user.email).split("@")[0] : "Guest");

    const av =
      (user?.user_metadata?.avatar_url as string) ||
      (user?.user_metadata?.picture as string) ||
      null;

    setName(display);
    setAvatarUrl(av);
  }

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      setIsAuthed(!!user);
      applyUser(user);
      setSessionReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        const u = session?.user ?? null;
        setIsAuthed(!!u);
        applyUser(u);
        setSessionReady(true);
      });

      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  const headerTitle =
    pathname === "/"
      ? "Dashboard"
      : pathname.includes("/detect/text")
      ? "Text Scan"
      : pathname.includes("/detect/image")
      ? "Image Scan"
      : pathname.includes("/scans/text")
      ? "Saved Text Scans"
      : pathname.includes("/scans/image")
      ? "Saved Image Scans"
      : pathname.includes("/billing")
      ? "Billing"
      : pathname.includes("/download")
      ? "Download"
      : pathname.includes("/account")
      ? "Account"
      : "Ghost Typer";

  function goAccountOrLogin() {
    if (!sessionReady) return;
    if (isAuthed) router.push("/account");
    else router.push(`/login?next=${encodeURIComponent("/account")}`);
  }

  const showName = sessionReady ? (name || "Guest") : "Checking…";

  // ✅ THIS FIXES IT: includes() catches list + detail URLs reliably
  const barConfig = useMemo(() => {
    const onText = pathname.includes("/detect/text") || pathname.includes("/scans/text");
    const onImage = pathname.includes("/detect/image") || pathname.includes("/scans/image");

    if (onText) return { tool: "detect_text", label: "Text Detector Tokens", unit: "words" as Unit };
    if (onImage) return { tool: "detect_image", label: "Image Detector Credits", unit: "images" as Unit };
    return null;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!barConfig) {
        setBar(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;

      if (!token) {
        setBar(null);
        return;
      }

      try {
        const res = await fetch(`/api/usage?tool=${encodeURIComponent(barConfig.tool)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setBar(null);
          return;
        }

        const parsed = extractUsage(j, barConfig.tool);
        const used = parsed?.used ?? 0;
        const limit = parsed?.limit ?? 0;

        if (!cancelled) {
          if (limit > 0) {
            setBar({
              label: barConfig.label,
              used,
              limit,
              unit: (parsed?.unit as Unit) || barConfig.unit,
            });
          } else {
            setBar(null);
          }
        }
      } catch {
        if (!cancelled) setBar(null);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [barConfig]);

  return (
    <div className="flex h-screen w-full bg-black text-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">{headerTitle}</div>
          </div>

          <button
            onClick={goAccountOrLogin}
            className="group flex items-center gap-3"
            title={isAuthed ? "Account" : "Log in"}
            type="button"
          >
            <div className="text-right leading-tight">
              <div className="text-xs text-white/55">{isAuthed ? "Welcome" : "Guest"}</div>
              <div className="text-sm font-medium text-white/90">{showName}</div>
            </div>

            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-white/5 transition group-hover:border-white/30">
              {sessionReady && avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                  {sessionReady ? (showName?.slice(0, 1).toUpperCase() || "G") : "…"}
                </div>
              )}
            </div>
          </button>
        </header>

        {/* ✅ Token bar */}
        {bar && (
          <div className="border-b border-white/10 bg-black/30 px-6 py-3">
            <TokenBar label={bar.label} used={bar.used} limit={bar.limit} unit={bar.unit} />
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
