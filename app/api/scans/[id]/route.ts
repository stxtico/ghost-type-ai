import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id || id === "undefined") return NextResponse.json({ error: "Missing scan id." }, { status: 400 });

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const { data, error } = await auth.supabase.from("scans").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (data.user_id && data.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ scan: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id || id === "undefined") return NextResponse.json({ error: "Missing scan id." }, { status: 400 });

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    const body = await req.json().catch(() => ({}));

    const updates: Record<string, any> = {};
    if (typeof body.title === "string") updates.title = body.title;
    if (typeof body.text === "string") updates.text = body.text;

    // ✅ allow saving result + ai_percent if columns exist
    if (body.result !== undefined) updates.result = body.result;
    if (body.ai_percent !== undefined) updates.ai_percent = body.ai_percent;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { data, error } = await auth.supabase.from("scans").update(updates).eq("id", id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (data.user_id && data.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ scan: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    if (!id || id === "undefined") return NextResponse.json({ error: "Missing scan id." }, { status: 400 });

    const auth = await requireUser(req);
    if (auth.err) return auth.err;

    // 1) Read scan to get owner + image_path
    const { data: existing, error: readErr } = await auth.supabase
      .from("scans")
      .select("id,user_id,kind,image_path")
      .eq("id", id)
      .single();

    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (existing.user_id && existing.user_id !== auth.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // 2) Delete file from storage if it exists
    const isImage = String(existing.kind || "").toLowerCase() === "image";
    const imagePath = existing.image_path ? String(existing.image_path) : null;

    if (isImage && imagePath) {
      // bucket name must match what you upload to
      const { error: storageErr } = await auth.supabase.storage.from("scan-images").remove([imagePath]);
      // If storage delete fails, we still attempt DB delete but report warning
      if (storageErr) {
        // still proceed (don’t strand DB row)
        // you can surface this to UI if you want
        console.warn("Storage delete failed:", storageErr.message);
      }
    }

    // 3) Delete DB row
    const { error: delErr } = await auth.supabase.from("scans").delete().eq("id", id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
