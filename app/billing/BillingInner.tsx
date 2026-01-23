"use client";

import AppShell from "@/app/_components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PlanId = "free" | "pro" | "premium";

function PlanCard(props: {
  name: string;
  price: string;
  tagline: string;
  perks: string[];
  highlight?: boolean;
  current?: boolean;
  onChoose?: () => void;
}) {
  const { name, price, tagline, perks, highlight, current, onChoose } = props;

  return (
    <div
      className={[
        "rounded-3xl border p-6",
        highlight ? "border-white/25 bg-white/10" : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="mt-1 text-sm text-white/60">{tagline}</div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-semibold">{price}</div>
          <div className="mt-1 text-xs text-white/50">per month</div>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-white/80">
        {perks.map((p, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-white/60">•</span>
            <span>{p}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {current ? (
          <div className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-sm text-white/80">
            Current plan
          </div>
        ) : (
          <button
            onClick={onChoose}
            className={[
              "w-full rounded-xl px-4 py-2 text-sm font-medium transition",
              highlight
                ? "bg-white text-black hover:opacity-90"
                : "border border-white/15 bg-white/5 text-white/85 hover:bg-white/10",
            ].join(" ")}
          >
            Choose {name}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BillingInner() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [planId, setPlanId] = useState<PlanId>("free");

  useEffect(() => {
    let unsub: any = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      setIsAuthed(!!session);

      if (session?.user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("plan_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const p = prof?.plan_id;
        if (p === "free" || p === "pro" || p === "premium") setPlanId(p);
      }

      const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, nextSession) => {
        setIsAuthed(!!nextSession);

        if (!nextSession?.user?.id) {
          setPlanId("free");
          return;
        }

        const { data: prof } = await supabase
          .from("profiles")
          .select("plan_id")
          .eq("user_id", nextSession.user.id)
          .maybeSingle();

        const p = prof?.plan_id;
        if (p === "free" || p === "pro" || p === "premium") setPlanId(p);
      });

      unsub = sub.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  function requireLogin() {
    window.location.href = "/login";
  }

  function placeholderCheckout(plan: Exclude<PlanId, "free">) {
    alert(`Checkout placeholder for ${plan.toUpperCase()} — wire Stripe later.`);
  }

  return (
    <AppShell>
      <main className="px-10 py-8">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="text-2xl font-semibold tracking-tight">Billing</div>
            <div className="mt-1 text-sm text-white/60">
              Manage your subscription and monthly usage limits.
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70">
            {isAuthed ? `Current: ${planId.toUpperCase()}` : "Guest"}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            tagline="Try the detectors with a small monthly limit."
            perks={[
              "Text detection: limited monthly words",
              "Image detection: limited monthly scans",
              "Saved scans (basic history)",
            ]}
            current={planId === "free"}
            onChoose={() => {
              if (!isAuthed) return requireLogin();
              alert("Free is the default plan. (No checkout needed)");
            }}
          />

          <PlanCard
            name="Pro"
            price="$14.99"
            tagline="For consistent school/work use."
            perks={[
              "Much higher text detection monthly words",
              "More image scans per month",
              "Priority processing (when enabled)",
              "Saved scans + export (later)",
            ]}
            highlight
            current={planId === "pro"}
            onChoose={() => {
              if (!isAuthed) return requireLogin();
              placeholderCheckout("pro");
            }}
          />

          <PlanCard
            name="Premium"
            price="$29.99"
            tagline="For heavy usage and creators."
            perks={[
              "Highest monthly text detection words",
              "Most image scans per month",
              "Fastest processing (when enabled)",
              "Advanced history + team features (later)",
            ]}
            current={planId === "premium"}
            onChoose={() => {
              if (!isAuthed) return requireLogin();
              placeholderCheckout("premium");
            }}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <div className="font-medium text-white/85">Next step (when you’re ready)</div>
          <div className="mt-2">
            To actually charge money, connect Stripe, create checkout links, then update{" "}
            <span className="text-white/90">profiles.plan_id</span> after payment via a webhook.
          </div>
        </div>
      </main>
    </AppShell>
  );
}
