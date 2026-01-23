"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safeNext(raw: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  if (raw.startsWith("/login")) return "/";
  return raw;
}

export default function AuthCallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      // Let Supabase finalize session from OAuth redirect
      await supabase.auth.getSession();
      const next = safeNext(sp.get("next"));
      router.replace(next);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
        Finishing sign-in…
      </div>
    </main>
  );
}
