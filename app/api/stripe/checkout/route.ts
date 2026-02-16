// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

type PlanId = "essentials" | "pro" | "premium";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getPriceId(plan: PlanId) {
  const map: Record<PlanId, string | undefined> = {
    essentials: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS,
    pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    premium: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM,
  };
  const priceId = map[plan];
  if (!priceId) {
    throw new Error(
      `Missing Stripe price id for "${plan}". Set env vars: NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS NEXT_PUBLIC_STRIPE_PRICE_PRO NEXT_PUBLIC_STRIPE_PRICE_PREMIUM`
    );
  }
  return priceId;
}

function originFromReq(req: Request) {
  const h = req.headers;
  const origin = h.get("origin");
  if (origin) return origin;
  // Vercel/proxy fallback
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Missing auth" }, { status: 401 });
    }

    const { plan } = (await req.json().catch(() => ({}))) as { plan?: PlanId };
    if (!plan || !["essentials", "pro", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseAnon || !supabaseService) {
      return NextResponse.json(
        { error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    // Verify user from JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid auth" }, { status: 401 });
    }
    const user = userData.user;

    // Service client to read/write profiles
    const supabaseAdmin = createClient(supabaseUrl, supabaseService);

    // Get or create stripe customer id in profiles (keyed by user_id)
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    let customerId = profile?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // ensure profile row exists + set customer id
      const { error: upErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          { user_id: user.id, stripe_customer_id: customerId },
          { onConflict: "user_id" }
        );

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
    }

    const origin = originFromReq(req);
    const priceId = getPriceId(plan);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/billing?success=1`,
      cancel_url: `${origin}/billing?canceled=1`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Checkout failed." },
      { status: 500 }
    );
  }
}
