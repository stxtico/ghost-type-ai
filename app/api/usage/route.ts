import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function periodKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tool = String(body?.tool ?? "humanizer"); // humanizer | detect_text | detect_image

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Supabase env missing." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token (Bearer)." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("plan_id")
      .eq("user_id", userId)
      .single();

    if (profErr) {
      return NextResponse.json({ error: `Profile lookup failed: ${profErr.message}` }, { status: 500 });
    }

    const planId = profile?.plan_id || "free";

    // Pull both limits from plans
    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("monthly_words, monthly_images")
      .eq("id", planId)
      .single();

    if (planErr) {
      return NextResponse.json({ error: `Plan lookup failed: ${planErr.message}` }, { status: 500 });
    }

    // detect_image uses monthly_images, everything else uses monthly_words
    const unit: "words" | "images" = tool === "detect_image" ? "images" : "words";
    const limit =
      unit === "images"
        ? Number((plan as any)?.monthly_images ?? 0)
        : Number((plan as any)?.monthly_words ?? 0);

    const period = periodKey();

    // We store usage counts in usage_monthly.words_used for ALL tools (including images),
    // so detect_image increments by +1 per scan.
    const { data: usageRow, error: usageErr } = await supabase
      .from("usage_monthly")
      .select("words_used")
      .eq("user_id", userId)
      .eq("period", period)
      .eq("tool", tool)
      .maybeSingle();

    if (usageErr) {
      return NextResponse.json({ error: `Usage lookup failed: ${usageErr.message}` }, { status: 500 });
    }

    const used = Number((usageRow as any)?.words_used ?? 0);

    return NextResponse.json({
      tool,
      period,
      planId,
      unit,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
