import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // needed for formData/file uploads

function periodKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

// ✅ Fixes browser/Vercel preflight (OPTIONS) so you don’t get random 405s
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Supabase env missing." }, { status: 500 });
    }

    const token = getBearer(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Authorization token (Bearer)." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    // auth
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const userId = userData.user.id;
    const tool = "detect_image";
    const period = periodKey();

    // form data
    const form = await req.formData();
    const file = form.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image." }, { status: 400 });
    }
    if (!file.type?.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image." }, { status: 400 });
    }

    // plan lookup
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("plan_id")
      .eq("user_id", userId)
      .single();

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

    const planId = profile?.plan_id || "free";

    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("monthly_images")
      .eq("id", planId)
      .single();

    if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });

    const limit = Number((plan as any)?.monthly_images ?? 0);

    const { data: usageRow, error: usageErr } = await supabase
      .from("usage_monthly")
      .select("words_used")
      .eq("user_id", userId)
      .eq("period", period)
      .eq("tool", tool)
      .maybeSingle();

    if (usageErr) return NextResponse.json({ error: usageErr.message }, { status: 500 });

    const used = Number((usageRow as any)?.words_used ?? 0);
    const remaining = Math.max(0, limit - used);

    if (remaining < 1) {
      return NextResponse.json(
        { error: `Not enough tokens. Need 1 image, you have ${remaining}.` },
        { status: 402 }
      );
    }

    // ---- YOUR DETECTOR LOGIC HERE ----
    // Placeholder: random AI percent. Replace with real model later.
    const aiPercent = Math.floor(30 + Math.random() * 60);
    const confidence =
      aiPercent > 70 ? "likely_ai" : aiPercent > 45 ? "uncertain" : "likely_human";

    // Commit usage (+1 image scan => words_used + 1)
    const { error: incErr } = await supabase.rpc("increment_usage", {
      p_user_id: userId,
      p_period: period,
      p_tool: tool,
      p_add_words: 1,
    });

    if (incErr) {
      // still return result, but warn usage didn’t update
      return NextResponse.json({
        aiPercent,
        confidence,
        warning: incErr.message,
        file: { size: file.size, type: file.type },
      });
    }

    return NextResponse.json({
      aiPercent,
      confidence,
      file: { size: file.size, type: file.type },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
