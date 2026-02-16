// app/api/billing/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlanId = "free" | "essentials" | "pro" | "premium";

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

    if (!token) {
      return NextResponse.json({ plan: "free" satisfies PlanId }, { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Validate user from token
    const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ plan: "free" satisfies PlanId }, { status: 200 });
    }

    const uid = userRes.user.id;

    // ✅ Read plan from profiles
    // IMPORTANT: if your profiles key column is NOT "id", change it here.
    // Common alternatives: "user_id"
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("plan, stripe_price_id, stripe_subscription_status")
      .eq("id", uid)
      .maybeSingle();

    if (profErr) {
      // If table/column mismatch, still don’t break UI
      return NextResponse.json({ plan: "free" satisfies PlanId, note: profErr.message }, { status: 200 });
    }

    const plan = (profile?.plan as PlanId | null) ?? planFromPriceId(profile?.stripe_price_id ?? null) ?? "free";

    return NextResponse.json(
      {
        plan,
        status: profile?.stripe_subscription_status ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ plan: "free" satisfies PlanId, error: e?.message ?? "unknown" }, { status: 200 });
  }
}
