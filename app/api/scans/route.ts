import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ScanType = "text" | "image";
const BUCKET = "scan-images";

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
    row.input_text,
    row.text,
    row.content,
    row.scan_text,
    row.body,
    row.result_text,
  ];
  const found = candidates.find((x) => typeof x === "string" && x.trim().length > 0);
  return found ? String(found).slice(0, 260) : null;
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

// prune+retry for schema differences
async function updateWithPrune(db: any, id: string, userId: string, patch: Record<string, any>) {
  let working = { ...patch };

  for (let attempt = 0; attempt < 8; attempt++) {
    const { error } = await db.from("scans").update(working).eq("id", id).eq("user_id", userId);
    if (!error) return;

    const msg = String(error.message || "");

    // patterns:
    // "column scans.ai_percent does not exist"
    // "Could not find the 'ai_percent' column of 'scans' in the schema cache"
    const m1 =
      msg.match(/column\s+["']?([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)["']?\s+does not exist/i) ||
      msg.match(/column\s+([a-zA-Z0-9_]+)\s+does not exist/i) ||
      msg.match(/Could not find the '([a-zA-Z0-9_]+)'\s+column/i);

    if (m1) {
      const missing = (m1 as any)[2] || (m1 as any)[1];
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
    const { supabaseUrl, supabaseAnon, serviceRole } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const userId = await getUserIdFromJwt(supabaseUrl, supabaseAnon, jwt);
    if (!userId) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const type = normalizeType(url.searchParams.get("type") ?? url.searchParams.get("kind"));

    const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const storage = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    if (id) {
      const { data, error } = await db.from("scans").select("*").eq("id", id).eq("user_id", userId).single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // attach image_url if only image_path exists
      const imagePath = pickImagePath(data);
      let image_url = pickImageUrl(data);

      if (!image_url && imagePath) {
        const { data: signed } = await storage.storage.from(BUCKET).createSignedUrl(imagePath, 3600);
        if (signed?.signedUrl) image_url = signed.signedUrl;
      }

      return NextResponse.json({
        scan: {
          ...data,
          image_path: imagePath,
          image_url,
          text_preview: pickTextPreview(data),
        },
      });
    }

    const { data, error } = await db
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const scans = await Promise.all(
      (data || []).map(async (r: any) => {
        const imagePath = pickImagePath(r);
        let image_url = pickImageUrl(r);

        if (type === "image" && !image_url && imagePath) {
          const { data: signed } = await storage.storage.from(BUCKET).createSignedUrl(imagePath, 3600);
          if (signed?.signedUrl) image_url = signed.signedUrl;
        }

        return {
          id: r.id,
          title: r.title ?? null,
          type,
          text_preview: type === "text" ? pickTextPreview(r) : null,
          image_url: type === "image" ? image_url : null,
          created_at: r.created_at,
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
    const { supabaseUrl, supabaseAnon, serviceRole } = getEnv();

    const jwt = getBearer(req);
    if (!jwt) return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });

    const userId = await getUserIdFromJwt(supabaseUrl, supabaseAnon, jwt);
    if (!userId) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    // allow title + optional fields for edit/rescan
    const patch: Record<string, any> = {};
    if (typeof body?.title === "string") patch.title = body.title.trim() || "Untitled";
    if (typeof body?.input_text === "string") patch.input_text = body.input_text;
    if (typeof body?.text === "string") patch.text = body.text;
    if (body?.result != null) patch.result = body.result;
    if (typeof body?.ai_percent === "number") patch.ai_percent = body.ai_percent;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await updateWithPrune(db, id, userId, patch);
    return NextResponse.json({ ok: true, id });
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
