import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ScanKind = "text" | "image";
const BUCKET = "scan-images";

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Supabase env missing (URL / ANON).");
  }
  return { supabaseUrl, supabaseAnon };
}

function getBearer(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

function normalizeKind(raw: string | null): ScanKind {
  return (raw || "").toLowerCase() === "image" ? "image" : "text";
}

function pickText(row: any): string {
  const candidates = [row.input_text, row.text, row.content, row.scan_text, row.body, row.result_text];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  return found ? String(found) : "";
}

function pickPreviewText(row: any): string | null {
  const candidates = [row.preview_text, row.text_preview, row.preview, row.snippet];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  if (found) return String(found).slice(0, 260);

  const full = pickText(row);
  return full ? full.trim().slice(0, 260) : null;
}

function pickImageUrl(row: any): string | null {
  const candidates = [row.image_url, row.preview_image_url, row.url];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  return found ? String(found) : null;
}

function pickImagePath(row: any): string | null {
  const candidates = [row.image_path, row.path, row.storage_path];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  return found ? String(found) : null;
}

function inferKind(row: any): ScanKind {
  // Prefer explicit "kind" column if it exists
  const k = String(row.kind || "").toLowerCase();
  if (k === "image") return "image";
  if (k === "text") return "text";

  // Fallback inference
  const hasImage = !!pickImagePath(row) || !!pickImageUrl(row);
  return hasImage ? "image" : "text";
}

function inferAiPercent(row: any): number | null {
  if (typeof row.ai_percent === "number") return Math.max(0, Math.min(100, row.ai_percent));
  const ap = row?.result?.aiPercent;
  if (typeof ap === "number") return Math.max(0, Math.min(100, ap));
  const hs = row?.result?.humanScore;
  if (typeof hs === "number") return Math.max(0, Math.min(100, 100 - hs));
  return null;
}

async function ensureImageUrl(sb: any, row: any) {
  const kind = inferKind(row);
  if (kind !== "image") return null;

  let image_url = pickImageUrl(row);
  const imagePath = pickImagePath(row);

  // For private bucket + RLS, signed URL requires auth (we use the user's JWT client)
  if (!image_url && imagePath) {
    const { data: signed, error: sErr } = await sb.storage.from(BUCKET).createSignedUrl(imagePath, 3600);
    if (!sErr && signed?.signedUrl) image_url = signed.signedUrl;
  }

  return image_url;
}

async function updateWithPrune(sb: any, id: string, userId: string, patch: Record<string, any>) {
  let working = { ...patch };

  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await sb.from("scans").update(working).eq("id", id).eq("user_id", userId);
    if (!error) return;

    const msg = String(error.message || "");
    const m =
      msg.match(/column\s+["']?([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)["']?\s+does not exist/i) ||
      msg.match(/column\s+([a-zA-Z0-9_]+)\s+does not exist/i) ||
      msg.match(/Could not find the '([a-zA-Z0-9_]+)'\s+column/i);

    if (m) {
      const missing = (m as any)[2] || (m as any)[1];
      if (missing && Object.prototype.hasOwnProperty.call(working, missing)) {
        const next = { ...working };
        delete next[missing];
        working = next;
        continue;
      }
    }

    throw error;
  }

  throw new Error("Update failed: scans table schema mismatch.");
}

export async function GET(req: Request) {
  try {
    const { supabaseUrl, supabaseAnon } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const sb = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const userId = userData.user.id;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // Accept kind= and legacy type=
    const wantKind = normalizeKind(url.searchParams.get("kind") ?? url.searchParams.get("type"));

    // OPEN ONE
    if (id) {
      const { data, error } = await sb.from("scans").select("*").eq("id", id).eq("user_id", userId).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const kind = inferKind(data);
      const image_url = await ensureImageUrl(sb, data);

      return NextResponse.json({
        scan: {
          ...data,
          kind,
          preview_text: kind === "text" ? pickPreviewText(data) : null,
          image_url: kind === "image" ? image_url : null,
          ai_percent: inferAiPercent(data),
        },
      });
    }

    const { data: all, error: allErr } = await sb
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });

    const filtered = (all || []).filter((r) => inferKind(r) === wantKind);

    const scans = await Promise.all(
      filtered.map(async (r: any) => {
        const kind = inferKind(r);
        const image_url = await ensureImageUrl(sb, r);

        return {
          id: String(r.id),
          title: r.title ?? null,
          kind,
          preview_text: kind === "text" ? pickPreviewText(r) : null,
          image_url: kind === "image" ? image_url : null,
          ai_percent: inferAiPercent(r),
          created_at: String(r.created_at),
        };
      })
    );

    return NextResponse.json({ scans });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { supabaseUrl, supabaseAnon } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const sb = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const patch: Record<string, any> = {};
    if (typeof body?.title === "string") patch.title = body.title.trim() || "Untitled";
    if (typeof body?.input_text === "string") patch.input_text = body.input_text;
    if (typeof body?.text === "string") patch.text = body.text;
    if (typeof body?.preview_text === "string") patch.preview_text = body.preview_text;
    if (body?.result != null) patch.result = body.result;
    if (typeof body?.ai_percent === "number") patch.ai_percent = body.ai_percent;

    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No fields to update." }, { status: 400 });

    // Ownership check
    const { data: owned, error: ownErr } = await sb
      .from("scans")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (ownErr) return NextResponse.json({ error: ownErr.message }, { status: 500 });
    if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await updateWithPrune(sb, id, userId, patch);
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { supabaseUrl, supabaseAnon } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const sb = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const { error } = await sb.from("scans").delete().eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
