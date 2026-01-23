// lib/savedScans.ts
import { supabase } from "@/lib/supabaseClient";

export type ScanType = "text" | "image";

export type SavedScanRow = {
  id: string;
  title: string | null;
  text: string | null;
  image_url: string | null;
  created_at: string;
};

export async function fetchLatestScans(type: ScanType, limit = 3) {
  // One table: scans
  // Filter by which column is present
  let q = supabase
    .from("scans")
    .select("id,title,text,image_url,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type === "text") {
    // Prefer: image_url IS NULL (text scan)
    q = q.is("image_url", null);
  } else {
    // Prefer: image_url IS NOT NULL (image scan)
    q = q.not("image_url", "is", null);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []) as SavedScanRow[];
}

export async function renameScan(id: string, title: string) {
  const clean = title.trim() || "Untitled";
  const { error } = await supabase.from("scans").update({ title: clean }).eq("id", id);
  if (error) throw error;
  return clean;
}

export async function deleteScan(id: string) {
  const { error } = await supabase.from("scans").delete().eq("id", id);
  if (error) throw error;
}
