// app/billing/page.tsx
"use client";

import AppShell from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useMemo, useState } from "react";

type PlanId = "free" | "essentials" | "pro" | "premium";

type Plan = {
  id: PlanId;
  name: string;
  priceLabel: string;
  tokensPerMonth: number;
  imageChecksPerMonth: number;
  description: string;
  isPaid: boolean;
};

export default function BillingPage() {
  const plans = useMemo<Plan[]>(
    () => [
      {
        id: "free",
        name: "Free",
        priceLabel: "$0",
        tokensPerMonth: 250,
        imageChecksPerMonth: 5,
        description: "Basic access for quick checks and light testing.",
        isPaid: false,
      },
      {
        id: "essentials",
        name: "Essentials",
        priceLabel: "$9.99 / mo",
        tokensPerMonth: 25_000,
        imageChecksPerMonth: 125,
        description: "Perfect for weekly use and steady scanning.",
        isPaid: true,
      },
      {
        id: "pro",
        name: "Professional",
        priceLabel: "$19.99 / mo",
        tokensPerMonth: 50_000,
        imageChecksPerMonth: 250,
        description: "Best for regular usage and frequent scans.",
        isPaid: true,
      },
      {
        id: "premium",
        name: "Premium",
        priceLabel: "$34.99 / mo",
        tokensPerMonth: 75_000,
        imageChecksPerMonth: 500,
        description: "For heavy usage with maximum monthly limits.",
        isPaid: true,
      },
    ],
    []
  );

  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    // not logged in = free
    if (!token) {
      setCurrentPlan("free");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/stripe/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load billing status.");
      }

      const plan = (json?.plan as PlanId) ?? "free";
      setCurrentPlan(plan);
    } catch (e: any) {
      setError(e?.message || "Failed to load billing status.");
      setCurrentPlan("free");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      await loadStatus();
      if (!alive) return;
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function startCheckout(planId: PlanId) {
    try {
      setError(null);

      if (planId === "free") return;

      const { data: sessionData, error: sessErr } =
        await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (sessErr || !token) throw new Error("Missing auth");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Checkout failed.");

      if (json?.url) window.location.href = json.url;
      else throw new Error("Checkout did not return a redirect URL.");
    } catch (e: any) {
      setError(e?.message || "Checkout failed.");
    }
  }

  return (
    <AppShell>
      <main className="px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        <div className="mb-6">
          <div className="text-2xl font-semibold tracking-tight">Billing</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Choose a plan that fits your usage. Tokens and image checks reset
            monthly.
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-4">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlan;

            return (
              <div
                key={p.id}
                className={[
                  "rounded-3xl border p-5 shadow-sm backdrop-blur",
                  "bg-white/60 dark:bg-white/5",
                  isCurrent
                    ? "border-emerald-400/40 ring-1 ring-emerald-400/30"
                    : "border-black/10 dark:border-white/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-black/90 dark:text-white/90">
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      {p.description}
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-4 text-2xl font-semibold text-black/90 dark:text-white/90">
                  {p.priceLabel}
                </div>

                <div className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
                  <div className="flex items-center justify-between">
                    <span>Tokens / month</span>
                    <span className="font-semibold">
                      {p.tokensPerMonth.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Image checks / month</span>
                    <span className="font-semibold">
                      {p.imageChecksPerMonth.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm text-black/50 dark:border-white/10 dark:bg-white/10 dark:text-white/50"
                    >
                      Loading…
                    </button>
                  ) : isCurrent ? (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
                    >
                      Current plan
                    </button>
                  ) : p.isPaid ? (
                    <button
                      onClick={() => startCheckout(p.id)}
                      className="w-full rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                    >
                      Subscribe
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm text-black/60 dark:border-white/10 dark:bg-white/10 dark:text-white/60"
                      title="Free plan is applied automatically when no subscription is active."
                    >
                      Free plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
