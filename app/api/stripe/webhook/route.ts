// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function planFromPriceId(priceId: string | null) {
  const essentials = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS;
  const pro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const premium = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;

  if (essentials && priceId === essentials) return "essentials";
  if (pro && priceId === pro) return "pro";
  if (premium && priceId === premium) return "premium";
  return "free";
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec) return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whsec);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseService);

  try {
    // Update plan when subscription changes
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const plan = planFromPriceId(priceId);

      await supabaseAdmin
        .from("profiles")
        .update({ plan })
        .eq("stripe_customer_id", customerId);

      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free" })
        .eq("stripe_customer_id", customerId);

      return NextResponse.json({ received: true });
    }

    // ignore others
    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Webhook handler failed" }, { status: 500 });
  }
}
