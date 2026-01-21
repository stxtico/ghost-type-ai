"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { supabase } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string>("Guest");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      const display =
        (user?.user_metadata?.full_name as string) ||
        (user?.user_metadata?.name as string) ||
        (user?.email ? user.email.split("@")[0] : "Guest");

      setName(display);

      const av =
        (user?.user_metadata?.avatar_url as string) ||
        (user?.user_metadata?.picture as string) ||
        null;

      setAvatarUrl(av);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        const u = session?.user;
        const d =
          (u?.user_metadata?.full_name as string) ||
          (u?.user_metadata?.name as string) ||
          (u?.email ? u.email.split("@")[0] : "Guest");
        setName(d);

        const a =
          (u?.user_metadata?.avatar_url as string) ||
          (u?.user_metadata?.picture as string) ||
          null;
        setAvatarUrl(a);
      });

      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  return (
    <div className="flex h-screen w-full bg-black text-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP HEADER */}
        <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <div className="text-lg font-semibold tracking-tight">Dashboard</div>
          </div>

          {/* CLICKABLE ACCOUNT AREA */}
          <button
            onClick={() => (window.location.href = "/account")}
            className="group flex items-center gap-3"
            title="Account"
            type="button"
          >
            <div className="text-right leading-tight">
              <div className="text-xs text-white/55">Welcome</div>
              <div className="text-sm font-medium text-white/90">{name}</div>
            </div>

            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-white/5 transition group-hover:border-white/30">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                  {name?.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          </button>
        </header>

        {/* PAGE CONTENT */}
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
