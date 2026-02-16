// app/api/stripe/status/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

type PlanId = "free" | "essentials" | "pro" | "premium";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function planFromPriceId(priceId: string | null): PlanId {
  if (!priceId) return "free";

  const essentials = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS;
  const pro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const premium = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;

  if (essentials && priceId === essentials) return "essentials";
  if (pro && priceId === pro) return "pro";
  if (premium && priceId === premium) return "premium";
  return "free";
}

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ plan: "free" }, { status: 200 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseAnon || !supabaseService) {
      return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
    }

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ plan: "free" }, { status: 200 });
    }

    // Admin read profile
    const supabaseAdmin = createClient(supabaseUrl, supabaseService);
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const customerId = profile?.stripe_customer_id as string | null;
    if (!customerId) {
      return NextResponse.json({ plan: "free" as PlanId, active: false }, { status: 200 });
    }

    // Find active/trialing subscription
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
      expand: ["data.items.data.price"],
    });

    const active = subs.data.find((s) => s.status === "active" || s.status === "trialing") || null;

    const priceId =
      (active?.items.data[0]?.price?.id as string | undefined) ?? null;

    const plan = planFromPriceId(priceId);

    return NextResponse.json({
      plan,
      active: !!active,
      stripeSubscriptionStatus: active?.status ?? "none",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load billing status." },
      { status: 500 }
    );
  }
}
