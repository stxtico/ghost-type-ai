import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // REQUIRED for file uploads on Vercel

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Supabase env missing");
  return { url, anon };
}

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

export async function POST(req: Request) {
  try {
    const { url, anon } = getEnv();

    /* ---- AUTH CHECK ---- */
    const jwt = getBearer(req);
    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(url, anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    /* ---- FORM DATA ---- */
    const form = await req.formData();
    const file = form.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    /* ---- PLACEHOLDER AI DETECTION ----
       Replace this later with your real detector
    */
    const aiPercent = Math.floor(40 + Math.random() * 40);

    return NextResponse.json({
      aiPercent,
      confidence: aiPercent > 70 ? "likely_ai" : aiPercent > 45 ? "uncertain" : "likely_human",
      file: {
        size: file.size,
        type: file.type,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
