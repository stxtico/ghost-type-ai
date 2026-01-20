"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMsg(error.message);
    else router.push("/account");
  }

  async function signUp() {
    setMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMsg(error.message);
    else setMsg("Account created. If email confirmation is on, confirm your email, then sign in.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Log in</h1>

        <input className="w-full border rounded-lg p-3" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full border rounded-lg p-3" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />

        <div className="flex gap-3">
          <button onClick={signIn} disabled={loading} className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button onClick={signUp} disabled={loading} className="px-4 py-2 rounded-lg border disabled:opacity-50">
            Sign up
          </button>
        </div>

        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </div>
    </main>
  );
}
