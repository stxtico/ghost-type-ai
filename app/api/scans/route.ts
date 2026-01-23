import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ScanType = "text" | "image";

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseAnon || !serviceRole) {
    throw new Error("Supabase env missing (URL / ANON / SERVICE_ROLE).");
  }
  return { supabaseUrl, supabaseAnon, serviceRole };
}

function getBearer(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

async function getUserIdFromJwt(supabaseUrl: string, supabaseAnon: string, jwt: string) {
  const authClient = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data, error } = await authClient.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

function normalizeType(raw: string | null): ScanType {
  const v = (raw || "text").toLowerCase();
  return v === "image" ? "image" : "text";
}

function pickTextPreview(row: any): string | null {
  const candidates = [
    row.text_preview,
    row.preview_text,
    row.text,
    row.content,
    row.scan_text,
    row.body,
    // if you store result JSON, you can optionally pull from it here
  ];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  return found ? String(found) : null;
}

function pickImageUrl(row: any): string | null {
  const candidates = [row.image_url, row.preview_image_url, row.url];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  return found ? String(found) : null;
}

export async function GET(req: Request) {
  try {
    const { supabaseUrl, supabaseAnon, serviceRole } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const userId = await getUserIdFromJwt(supabaseUrl, supabaseAnon, jwt);
    if (!userId) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const url = new URL(req.url);
    const type = normalizeType(url.searchParams.get("type") ?? url.searchParams.get("kind"));

    const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const { data, error } = await db
      .from("scans")
      .select("id, user_id, kind, title, created_at, preview_text, preview_image_url, image_url, text")
      .eq("user_id", userId)
      .eq("kind", type) // IMPORTANT: requires scans.kind to be 'text' or 'image'
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const scans = (data || []).map((r: any) => ({
      id: r.id,
      title: r.title ?? null,
      type,
      text_preview: type === "text" ? pickTextPreview(r) : null,
      image_url: type === "image" ? pickImageUrl(r) : null,
      created_at: r.created_at,
    }));

    return NextResponse.json({ scans });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { supabaseUrl, supabaseAnon, serviceRole } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const userId = await getUserIdFromJwt(supabaseUrl, supabaseAnon, jwt);
    if (!userId) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    const title = String(body?.title || "").trim() || "Untitled";
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const { error } = await db.from("scans").update({ title }).eq("id", id).eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id, title });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { supabaseUrl, supabaseAnon, serviceRole } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const userId = await getUserIdFromJwt(supabaseUrl, supabaseAnon, jwt);
    if (!userId) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const { error } = await db.from("scans").delete().eq("id", id).eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
