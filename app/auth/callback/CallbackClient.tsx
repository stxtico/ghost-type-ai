"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CallbackClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState<string>("Finishing sign-in…");

  useEffect(() => {
    (async () => {
      try {
        // Supabase OAuth returns ?code=... for PKCE
        const code = search.get("code");
        const next = search.get("next") || "/";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg(error.message);
            // Send them to login but don't loop forever
            router.replace(`/login?next=${encodeURIComponent(next)}&err=oauth`);
            return;
          }
        }

        // If no code, still try to proceed (some flows may already have session)
        router.replace(next);
      } catch (e: any) {
        setMsg(e?.message || "Sign-in failed.");
        router.replace("/login?err=oauth");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
        {msg}
      </div>
    </main>
  );
}
