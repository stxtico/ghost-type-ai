"use client";

import React, { useMemo, useRef, useState } from "react";
import { useWallpaper } from "@/app/_components/WallpaperProvider";

type Preset = { id: string; name: string; css: string; accents: [string, string, string] };

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (x: number) => x.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Very lightweight dominant color extraction:
// - downsamples
// - quantizes into buckets
// - picks top 3 buckets
async function extractTop3ColorsFromImage(file: File): Promise<[string, string, string]> {
  const url = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    const maxW = 140;
    const scale = Math.min(1, maxW / img.width);
    const w = Math.max(20, Math.round(img.width * scale));
    const h = Math.max(20, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return ["#ef4444", "#a855f7", "#3b82f6"];

    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    // bucket: 0..255 -> step
    const step = 24;
    const map = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      if (a < 0.6) continue;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // ignore near-black and near-white pixels (usually text/background noise)
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum < 18 || lum > 245) continue;

      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;

      const key = `${r},${g},${b}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    // If image is too uniform, fallback accents
    if (!sorted.length) return ["#ef4444", "#a855f7", "#3b82f6"];

    // pick 3 that are "different enough"
    const pick: Array<[number, number, number]> = [];
    const dist = (c1: number[], c2: number[]) => {
      const dr = c1[0] - c2[0];
      const dg = c1[1] - c2[1];
      const db = c1[2] - c2[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    for (const [k] of sorted) {
      const parts = k.split(",").map((x) => Number(x));
      if (parts.length !== 3) continue;
      if (pick.length === 0) pick.push([parts[0], parts[1], parts[2]]);
      else if (pick.every((p) => dist(p, parts) >= 60)) pick.push([parts[0], parts[1], parts[2]]);
      if (pick.length === 3) break;
    }

    while (pick.length < 3) {
      // add fallback-ish colors
      pick.push([59, 130, 246]);
    }

    return [
      rgbToHex(pick[0][0], pick[0][1], pick[0][2]),
      rgbToHex(pick[1][0], pick[1][1], pick[1][2]),
      rgbToHex(pick[2][0], pick[2][1], pick[2][2]),
    ];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function WallpaperPicker() {
  const { wallpaperUrl, accent1, accent2, accent3, setTheme, resetTheme } = useWallpaper();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const presets: Preset[] = useMemo(
    () => [
      {
        id: "nebula",
        name: "Nebula",
        css: "radial-gradient(1200px 600px at 20% 15%, rgba(168,85,247,0.40), transparent 60%), radial-gradient(900px 520px at 70% 25%, rgba(59,130,246,0.30), transparent 55%), radial-gradient(1100px 700px at 45% 85%, rgba(239,68,68,0.18), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.86))",
        accents: ["#a855f7", "#3b82f6", "#ef4444"],
      },
      {
        id: "ember",
        name: "Ember",
        css: "radial-gradient(1000px 650px at 20% 20%, rgba(239,68,68,0.35), transparent 60%), radial-gradient(900px 520px at 75% 30%, rgba(251,113,133,0.18), transparent 55%), radial-gradient(1000px 700px at 50% 90%, rgba(168,85,247,0.18), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.86))",
        accents: ["#ef4444", "#fb7185", "#a855f7"],
      },
      {
        id: "deepblue",
        name: "Deep Blue",
        css: "radial-gradient(1000px 650px at 25% 20%, rgba(59,130,246,0.35), transparent 60%), radial-gradient(900px 520px at 75% 40%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(1000px 700px at 50% 90%, rgba(99,102,241,0.18), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.86))",
        accents: ["#3b82f6", "#0ea5e9", "#6366f1"],
      },
      {
        id: "carbon",
        name: "Carbon",
        css: "radial-gradient(1100px 700px at 20% 20%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(900px 520px at 80% 35%, rgba(255,255,255,0.06), transparent 55%), linear-gradient(180deg, rgba(0,0,0,0.95), rgba(0,0,0,0.88))",
        accents: ["#9ca3af", "#6b7280", "#ef4444"],
      },
    ],
    []
  );

  function applyPreset(p: Preset) {
    // Store CSS as a "wallpaperUrl" marker using a custom protocol-like prefix.
    // We’ll render it via CSS var in globals (below).
    setTheme({
      wallpaperUrl: `__css__:${p.css}`,
      accent1: p.accents[0],
      accent2: p.accents[1],
      accent3: p.accents[2],
    });
  }

  async function onUpload(file: File | null) {
    if (!file) return;

    setBusy(true);
    try {
      const accents = await extractTop3ColorsFromImage(file);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setTheme({
        wallpaperUrl: dataUrl,
        accent1: accents[0],
        accent2: accents[1],
        accent3: accents[2],
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const chip = (c: string) => (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
      <span className="h-3 w-3 rounded-full" style={{ background: c }} />
      {c.toUpperCase()}
    </span>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Presets */}
      <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white/90">Preset wallpapers</div>
            <div className="text-xs text-white/55">Dark, Apple-ish, clean gradients.</div>
          </div>
          <button
            type="button"
            onClick={resetTheme}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
          >
            Reset
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left hover:bg-black/50"
            >
              <div className="h-28 w-full" style={{ backgroundImage: p.css }} />
              <div className="p-3">
                <div className="text-sm font-semibold text-white/90">{p.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: p.accents[0] }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: p.accents[1] }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: p.accents[2] }} />
                  <span className="ml-1 text-xs text-white/50">Accents</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Upload + current */}
      <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="text-sm font-semibold text-white/90">Your theme</div>
        <div className="mt-1 text-xs text-white/55">Upload a wallpaper and we’ll match the UI.</div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="text-xs text-white/60">Current accents</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {chip(accent1)}
            {chip(accent2)}
            {chip(accent3)}
          </div>

          <div className="mt-4 text-xs text-white/60">Background</div>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70">
            {wallpaperUrl
              ? wallpaperUrl.startsWith("__css__:")
                ? "Preset gradient wallpaper"
                : "Custom uploaded image"
              : "None (default)"}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
              {busy ? "Extracting…" : "Upload image"}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              />
            </label>

            {wallpaperUrl && !busy && (
              <button
                type="button"
                onClick={() => setTheme({ wallpaperUrl: null })}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              >
                Remove bg
              </button>
            )}
          </div>

          <div className="mt-3 text-[11px] leading-relaxed text-white/45">
            Tip: photos with strong colors work best. Very dark/white images may produce subtle accents.
          </div>
        </div>
      </aside>
    </div>
  );
}
