import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
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
    return { supabase: null as any, userId: null as any, err: NextResponse.json({ error: "Missing Authorization token (Bearer)." }, { status: 401 }) };
  }

  const supabase = makeSupabase(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return { supabase: null as any, userId: null as any, err: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };
  }

  return { supabase, userId: userData.user.id, err: null as any };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing scan id." }, { status: 400 });
    }

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const { data, error } = await auth.supabase
      .from("scans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // Extra guard (RLS should also enforce this)
    if (data.user_id && data.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing scan id." }, { status: 400 });
    }

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const body = await req.json().catch(() => ({}));

    // Only allow fields you actually want editable:
    const updates: Record<string, any> = {};
    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.text === "string") updates.text = body.text;
    if (body.result !== undefined) updates.result = body.result;
    if (body.ai_percent !== undefined) updates.ai_percent = body.ai_percent;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("scans")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (data.user_id && data.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing scan id." }, { status: 400 });
    }

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    // Optional: ensure it exists + owned before delete
    const { data: existing } = await auth.supabase
      .from("scans")
      .select("id,user_id")
      .eq("id", id)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (existing.user_id && existing.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error } = await auth.supabase.from("scans").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
