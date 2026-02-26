// app/login/LoginClient.tsx
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

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.2 0 6.1 1.1 8.3 3.2l6.2-6.2C34.6 2.3 29.6 0 24 0 14.6 0 6.5 5.5 2.5 13.4l7.2 5.6C11.6 13.3 17.2 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.7-.1-2.9-.4-4.2H24v8h12.7c-.3 2-1.7 5-4.8 7l7.4 5.8c4.3-4 6.8-9.8 6.8-16.6z"
      />
      <path
        fill="#FBBC05"
        d="M9.7 28.9c-1-2.9-1-6 0-8.9l-7.2-5.6C.9 17.5 0 20.6 0 24c0 3.4.9 6.5 2.5 9.6l7.2-5.6z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 12-2.1 16-5.8l-7.4-5.8c-2 1.4-4.7 2.4-8.6 2.4-6.8 0-12.4-3.8-14.4-9.5l-7.2 5.6C6.5 42.5 14.6 48 24 48z"
      />
    </svg>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const next = safeNext(sp.get("next")) || "/dashboard";

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

    // ✅ Preserve next through OAuth redirect
    const redirectTo = `${window.location.origin}/login?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    setOauthLoading(false);
    if (error) setMsg(error.message);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <Link
        href="/"
        className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        aria-label="Close login"
        title="Back to Landing"
      >
        ✕
      </Link>

      <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-white/60">Sign in to scan and save results.</p>

        <button
          onClick={signInWithGoogle}
          disabled={oauthLoading || loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
        >
          <GoogleIcon />
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