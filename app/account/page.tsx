"use client";

import { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const display =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.email ? user.email.split("@")[0] : "User");

      setEmail(user.email ?? null);
      setName(display);

      // try to fetch plan from profiles table (optional; won’t crash if not set)
      const { data: prof } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prof?.plan_id) setPlan(prof.plan_id);

      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        if (!session) window.location.href = "/login";
      });
      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AppShell>
      <main className="px-10 py-10">
        <div className="mb-8">
          <div className="text-2xl font-semibold tracking-tight">Account</div>
          <div className="mt-1 text-sm text-white/60">
            Manage your Ghost Typer profile and subscription.
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            Loading…
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-medium">Profile</div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-white/60">Name</div>
                  <div className="text-white/90">{name}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white/60">Email</div>
                  <div className="text-white/90">{email}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="mt-6 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Log out
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-medium">Subscription</div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="text-xs uppercase tracking-widest text-white/50">
                  Current Plan
                </div>
                <div className="mt-1 text-lg font-semibold capitalize">
                  {plan}
                </div>
                <div className="mt-2 text-sm text-white/60">
                  Upgrade options will connect to your checkout later.
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => window.open("https://google.com", "_blank")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
                >
                  Upgrade
                </button>
                <button
                  onClick={() => window.open("https://google.com", "_blank")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
                >
                  Billing
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
