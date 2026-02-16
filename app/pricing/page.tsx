// app/pricing/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        {/* ✅ clickable brand back to landing */}
        <Link href="/" className="flex items-center gap-2 text-white">
          <Image
            src="/branding/ghost-light.png"
            alt="Ghost Typer"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          <span className="text-sm font-semibold tracking-tight">Ghost Typer</span>
          <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
            BETA
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <Link className="hover:text-white" href="/dashboard">
            Dashboard
          </Link>
          <Link className="hover:text-white" href="/features">
            Features
          </Link>
          <Link className="text-white" href="/pricing">
            Pricing
          </Link>
          <Link
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            href="/dashboard"
          >
            Get Started →
          </Link>
        </nav>

        <div className="md:hidden">
          <Link
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black"
            href="/dashboard"
          >
            Open
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function PricingPage() {
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

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;

      if (!uid) {
        if (!alive) return;
        setCurrentPlan("free");
        setLoading(false);
        return;
      }

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", uid)
        .maybeSingle();

      if (!alive) return;

      if (profErr) {
        setError(profErr.message);
        setCurrentPlan("free");
      } else {
        setCurrentPlan(((profile?.plan as PlanId | null) ?? "free"));
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  async function startCheckout(planId: PlanId) {
    try {
      setError(null);

      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
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
    <main className="min-h-screen bg-black text-white">
      <TopNav />

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
            Choose a plan that fits your usage. Tokens and image checks reset monthly.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
                  "bg-white/5",
                  isCurrent ? "border-emerald-400/40 ring-1 ring-emerald-400/30" : "border-white/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-white">
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs text-white/70">{p.description}</div>
                  </div>

                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-4 text-2xl font-semibold text-white">{p.priceLabel}</div>

                <div className="mt-4 space-y-2 text-sm text-white/80">
                  <div className="flex items-center justify-between">
                    <span>Tokens / month</span>
                    <span className="font-semibold">{p.tokensPerMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Image checks / month</span>
                    <span className="font-semibold">{p.imageChecksPerMonth.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60"
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
                      className="w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                    >
                      Subscribe
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
                      title="Free plan is applied automatically when no subscription is active."
                    >
                      Free (auto)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8 text-sm text-white/50">
          <span>© {new Date().getFullYear()} Ghost Typer</span>
          <div className="flex gap-4">
            <Link href="/features" className="hover:text-white/80">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-white/80">
              Pricing
            </Link>
            <Link href="/dashboard" className="hover:text-white/80">
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
