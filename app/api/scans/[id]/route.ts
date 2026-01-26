import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

// Accepts 0-1 or 0-100 and returns INT 0-100
function normalizePercent(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const scaled = n <= 1 ? n * 100 : n;
  const rounded = Math.round(scaled);
  return Math.max(0, Math.min(100, rounded));
}

function makeSupabase(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseAnon) throw new Error("Supabase env missing.");

  return createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

async function requireUser(req: Request) {
  const token = getBearer(req);
  if (!token) {
    return {
      supabase: null as any,
      userId: null as any,
      err: NextResponse.json({ error: "Missing Authorization token (Bearer)." }, { status: 401 }),
    };
  }

  const supabase = makeSupabase(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return {
      supabase: null as any,
      userId: null as any,
      err: NextResponse.json({ error: "Invalid session." }, { status: 401 }),
    };
  }

  return { supabase, userId: userData.user.id, err: null as any };
}

type Ctx = { params: Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<string | null> {
  try {
    const p = await ctx.params;
    const id = p?.id;
    if (typeof id === "string" && isUuid(id)) return id;
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "Invalid or missing scan id." }, { status: 400 });

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const { data, error } = await auth.supabase
      .from("scans")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found." }, { status: 404 });

    return NextResponse.json({ scan: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "Invalid or missing scan id." }, { status: 400 });

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const body = await req.json().catch(() => ({}));

    const updates: Record<string, any> = {};
    if (typeof body.title === "string") updates.title = body.title.trim() || "Untitled";
    if (typeof body.text === "string") updates.text = body.text;
    if (typeof body.input_text === "string") updates.input_text = body.input_text;
    if (typeof body.preview_text === "string") updates.preview_text = body.preview_text;

    if (body.result !== undefined) updates.result = body.result;

    // ✅ normalize to INT 0-100
    if (body.ai_percent !== undefined) updates.ai_percent = normalizePercent(body.ai_percent);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    // 🚫 DO NOT write updated_at (your table doesn't have it)

    const { data, error } = await auth.supabase
      .from("scans")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

    return NextResponse.json({ scan: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    if (!id) return NextResponse.json({ error: "Invalid or missing scan id." }, { status: 400 });

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const { error } = await auth.supabase.from("scans").delete().eq("id", id).eq("user_id", auth.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
