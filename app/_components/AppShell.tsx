"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { supabase } from "@/lib/supabaseClient";
import TokenBar from "@/components/TokenBar";
import { LANG_LABEL, type Lang, t, useLang } from "@/app/_components/LanguageProvider";

type Unit = "words" | "images";
type BarState =
  | {
      label: string;
      used: number;
      limit: number;
      unit: Unit;
    }
  | null;

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
    if (row) {
      return {
        used: clampInt(row.words_used ?? row.used, 0),
        limit: clampInt(row.limit ?? row.monthly_limit, 0),
        unit: row.unit,
      };
    }
  }

  const data = payload?.data;
  if (Array.isArray(data)) {
    const row = data.find((r) => String(r?.tool) === tool);
    if (row) {
      return {
        used: clampInt(row.words_used ?? row.used, 0),
        limit: clampInt(row.limit ?? row.monthly_limit, 0),
        unit: row.unit,
      };
    }
  }

  return null;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { lang, setLang } = useLang();

  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [name, setName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [bar, setBar] = useState<BarState>(null);

  // language dropdown state
  const [langOpen, setLangOpen] = useState(false);

  function tr(key: string, fallback: string) {
    const v = t(lang, key);
    if (!v || v === key) return fallback;
    return v;
  }

  function applyUser(user: any | null) {
    const display =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.email ? String(user.email).split("@")[0] : "Guest");

    const av = (user?.user_metadata?.avatar_url as string) || (user?.user_metadata?.picture as string) || null;

    setName(display);
    setAvatarUrl(av);
  }

  // close language dropdown on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest?.('[data-lang-menu="1"]')) return;
      setLangOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // auth state
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

  // ✅ Fix: "/" is landing, "/dashboard" is dashboard
  const headerTitle = useMemo(() => {
    if (pathname === "/") return "Ghost Typer";
    if (pathname === "/dashboard") return tr("dashboard", "Dashboard");

    if (pathname.startsWith("/detect/text")) return tr("textScan", "Text Scan");
    if (pathname.startsWith("/detect/image")) return tr("imageScan", "Image Scan");
    if (pathname.startsWith("/scans/text")) return tr("savedText", "Saved Text");
    if (pathname.startsWith("/scans/image")) return tr("savedImage", "Saved Images");
    if (pathname.startsWith("/billing") || pathname.startsWith("/pricing")) return tr("billing", "Billing");
    if (pathname.startsWith("/download")) return tr("download", "Download");
    if (pathname.startsWith("/themes")) return tr("themes", "Themes");
    if (pathname.startsWith("/account")) return tr("account", "Account");
    if (pathname.startsWith("/featured")) return tr("featured", "Featured");

    return "Ghost Typer";
  }, [pathname, lang]);

  function goAccountOrLogin() {
    if (!sessionReady) return;
    if (isAuthed) router.push("/account");
    else router.push(`/login?next=${encodeURIComponent("/account")}`);
  }

  const showName = sessionReady ? (name || tr("guest", "Guest")) : tr("checking", "Checking…");

  // token bar config by route
  const barConfig = useMemo(() => {
    const onText = pathname.startsWith("/detect/text") || pathname.startsWith("/scans/text");
    const onImage = pathname.startsWith("/detect/image") || pathname.startsWith("/scans/image");
    if (onText) return { tool: "detect_text", label: tr("textDetectorTokens", "Text Detector Tokens"), unit: "words" as Unit };
    if (onImage) return { tool: "detect_image", label: tr("imageDetectorTokens", "Image Detector Tokens"), unit: "images" as Unit };
    return null;
  }, [pathname, lang]);

  // load token bar
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

  const welcomeLabel = useMemo(() => {
    return isAuthed ? tr("welcome", "Welcome") : tr("guest", "Guest");
  }, [isAuthed, lang]);

  return (
    <div className="flex h-screen w-full bg-transparent text-white">
      {/* ✅ FIX: Sidebar only takes pathname now */}
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="isolate relative z-30 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">{headerTitle}</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language dropdown */}
            <div className="relative z-9999" data-lang-menu="1">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85 hover:bg-white/10"
                title={tr("language", "Language")}
              >
                <span className="opacity-80">🌐</span>
                <span className="font-medium">{LANG_LABEL[lang]}</span>
                <span className="opacity-60">▾</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 z-9999 w-52 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
                  {Object.entries(LANG_LABEL).map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLang(code as Lang);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition
                        ${code === lang ? "bg-white/10" : "hover:bg-white/5"}
                      `}
                    >
                      <span className="text-white/85">{label}</span>
                      {code === lang && <span className="text-white/50">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account */}
            <button
              onClick={goAccountOrLogin}
              className="group flex items-center gap-3"
              title={isAuthed ? tr("account", "Account") : tr("login", "Log in")}
              type="button"
            >
              <div className="text-right leading-tight">
                <div className="text-xs text-white/55">{welcomeLabel}</div>
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
          </div>
        </header>

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
