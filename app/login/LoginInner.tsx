// LoginInner.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safeNext(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/login")) return null;
  return raw;
}

export default function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = safeNext(sp.get("next")) || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function signIn() {
    setMsg(null);

    if (!email.trim() || !password) {
      setMsg("Enter email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.replace(next);
  }

  async function signUp() {
    setMsg(null);

    if (!email.trim() || !password) {
      setMsg("Enter email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Account created. If email confirmation is on, confirm your email, then sign in.");
  }

  async function signInWithGoogle() {
    setMsg(null);
    setOauthLoading(true);

    const redirectTo = `${window.location.origin}${next}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    setOauthLoading(false);
    if (error) setMsg(error.message);
  }

  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Link
        href="/"
        className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        aria-label="Close login"
        title="Back to Dashboard"
      >
        ✕
      </Link>

      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-white/60">Sign in to scan and save results.</p>

        <button
          onClick={signInWithGoogle}
          disabled={oauthLoading || loading}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 hover:bg-white/10 disabled:opacity-50"
        >
          {oauthLoading ? "Connecting…" : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-white/10" />
          <div className="text-xs text-white/45">or</div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={signIn}
            disabled={loading || oauthLoading}
            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            onClick={signUp}
            disabled={loading || oauthLoading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 hover:bg-white/10 disabled:opacity-50"
          >
            Sign up
          </button>
        </div>

        {msg && (
          <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-red-200">
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}
