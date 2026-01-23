"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [name, setName] = useState<string>(""); // don’t default to Guest until ready
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
      : pathname.startsWith("/detect/text")
      ? "Text Scan"
      : pathname.startsWith("/detect/image")
      ? "Image Scan"
      : pathname.startsWith("/scans/text")
      ? "Saved Text Scans"
      : pathname.startsWith("/scans/image")
      ? "Saved Image Scans"
      : pathname.startsWith("/billing")
      ? "Billing"
      : pathname.startsWith("/download")
      ? "Download"
      : pathname.startsWith("/account")
      ? "Account"
      : "Ghost Typer";

  function goAccountOrLogin() {
    if (!sessionReady) return;

    if (isAuthed) {
      router.push("/account");
    } else {
      router.push(`/login?next=${encodeURIComponent("/account")}`);
    }
  }

  const showName = sessionReady ? (name || "Guest") : "Checking…";

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

        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
