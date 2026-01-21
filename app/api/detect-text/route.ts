import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function periodKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function labelFromHumanScore(h: number): "ai" | "maybe" | "human" {
  if (h < 35) return "ai";
  if (h < 65) return "maybe";
  return "human";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Missing text." }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const winstonKey = process.env.WINSTON_API_KEY!;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Supabase env missing." }, { status: 500 });
    }
    if (!winstonKey) {
      return NextResponse.json({ error: "WINSTON_API_KEY missing on server." }, { status: 500 });
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
    const tool = "detect_text";
    const period = periodKey();

    // words used for your quota
    const words = text.split(/\s+/).filter(Boolean).length;

    // plan
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("plan_id")
      .eq("user_id", userId)
      .single();

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

    const planId = profile?.plan_id || "free";
    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("monthly_words")
      .eq("id", planId)
      .single();

    if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });

    const limit = Number((plan as any)?.monthly_words ?? 0);

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

    if (words > remaining) {
      return NextResponse.json(
        { error: `Not enough tokens. Need ${words}, you have ${remaining}.` },
        { status: 402 }
      );
    }

    // Winston call
    const wRes = await fetch("https://api.gowinston.ai/v2/ai-content-detection", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${winstonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        sentences: true,
        language: "auto",
        version: "latest",
      }),
    });

    const wJson: any = await wRes.json().catch(() => ({}));
    if (!wRes.ok) {
      return NextResponse.json(
        { error: wJson?.message || wJson?.error || `Winston error (${wRes.status})`, details: wJson },
        { status: 502 }
      );
    }

    // Winston "score" is HUMAN score 0..100
    const humanScore = clamp(Number(wJson?.score ?? 0), 0, 100);
    const aiPercent = clamp(100 - humanScore, 0, 100);

    const sentencesRaw = Array.isArray(wJson?.sentences) ? wJson.sentences : [];
    const sentences = sentencesRaw.map((s: any) => {
      const hs = clamp(Number(s?.score ?? 0), 0, 100);
      return {
        text: String(s?.text ?? ""),
        humanScore: hs,
        aiScore: clamp(100 - hs, 0, 100),
        label: labelFromHumanScore(hs),
      };
    });

    // Commit usage
    const { error: incErr } = await supabase.rpc("increment_usage", {
      p_user_id: userId,
      p_period: period,
      p_tool: tool,
      p_add_words: words,
    });

    if (incErr) {
      return NextResponse.json({ aiPercent, humanScore, sentences, warning: incErr.message });
    }

    return NextResponse.json({ aiPercent, humanScore, sentences });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
