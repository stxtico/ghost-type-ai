"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

function periodNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [limit, setLimit] = useState(0);
  const [used, setUsed] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setLoading(false);
        return;
      }
      setEmail(session.user.email ?? null);

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("user_id", session.user.id)
        .single();

      if (profErr) { setMsg(profErr.message); setLoading(false); return; }

      const planId = prof?.plan_id ?? "free";
      setPlan(planId);

      const { data: planRow, error: planErr } = await supabase
        .from("plans")
        .select("monthly_words")
        .eq("id", planId)
        .single();

      if (planErr) { setMsg(planErr.message); setLoading(false); return; }

      const monthlyWords = planRow?.monthly_words ?? 0;
      setLimit(monthlyWords);

      const period = periodNow();
      const { data: usageRows, error: usageErr } = await supabase
        .from("usage_monthly")
        .select("words_used")
        .eq("user_id", session.user.id)
        .eq("period", period);

      if (usageErr) { setMsg(usageErr.message); setLoading(false); return; }

      const totalUsed = (usageRows ?? []).reduce((s, r) => s + (r.words_used ?? 0), 0);
      setUsed(totalUsed);

      setLoading(false);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const remaining = Math.max(0, limit - used);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4 border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Account</h1>
          <div className="flex gap-2">
            <Link className="px-3 py-2 rounded-lg border" href="/download">Download</Link>
            <button className="px-3 py-2 rounded-lg bg-black text-white" onClick={logout}>Log out</button>
          </div>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : email ? (
          <div className="space-y-2">
            <div><span className="font-medium">Email:</span> {email}</div>
            <div><span className="font-medium">Plan:</span> {plan}</div>
            <div><span className="font-medium">Words remaining:</span> {remaining.toLocaleString()} / {limit.toLocaleString()}</div>
          </div>
        ) : (
          <div>
            You’re not logged in. <Link className="underline" href="/login">Log in</Link>
          </div>
        )}

        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </div>
    </main>
  );
}
