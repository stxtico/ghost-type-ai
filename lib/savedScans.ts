export type SavedScan = {
  id: string;
  type: "text" | "image";
  title: string;         // shown in sidebar
  createdAt: number;     // Date.now()
  payload: any;          // whatever you want (aiPercent, text snippet, etc.)
};

const KEY = "aai_saved_scans_v1";

function readAll(): SavedScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(scans: SavedScan[]) {
  localStorage.setItem(KEY, JSON.stringify(scans.slice(0, 50))); // keep last 50
}

export function getSavedScans(type?: "text" | "image") {
  const all = readAll().sort((a, b) => b.createdAt - a.createdAt);
  return type ? all.filter((s) => s.type === type) : all;
}

export function saveScan(scan: SavedScan) {
  const all = readAll();
  const next = [scan, ...all.filter((s) => s.id !== scan.id)];
  writeAll(next);
}

export function deleteScan(id: string) {
  const all = readAll().filter((s) => s.id !== id);
  writeAll(all);
}
