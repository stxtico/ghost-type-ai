"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type PresetId =
  | "amethyst"
  | "crimson"
  | "deep_ocean"
  | "nebula"
  | "midnight"
  | "ember"
  | "ultraviolet";

type Mode = "preset" | "upload";

type WallpaperState = {
  mode: Mode;
  preset: PresetId;
  uploadDataUrl: string | null; // base64 data url
  accent: [number, number, number];
  accent2: [number, number, number];
  accent3: [number, number, number];
};

type Ctx = {
  state: WallpaperState;
  setPreset: (id: PresetId) => void;
  setUpload: (dataUrl: string) => Promise<void>;
  clearUpload: () => void;
};

const KEY = "gt_wallpaper_v1";

const DEFAULT: WallpaperState = {
  mode: "preset",
  preset: "amethyst",
  uploadDataUrl: null,
  accent: [168, 85, 247],
  accent2: [59, 130, 246],
  accent3: [239, 68, 68],
};

const WallpaperContext = createContext<Ctx | null>(null);

function clamp(n: number, a = 0, b = 255) {
  return Math.max(a, Math.min(b, n));
}

function rgbToCss(rgb: [number, number, number]) {
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
}

function applyCssVars(s: WallpaperState) {
  const root = document.documentElement;

  root.style.setProperty("--gt-accent", rgbToCss(s.accent));
  root.style.setProperty("--gt-accent-2", rgbToCss(s.accent2));
  root.style.setProperty("--gt-accent-3", rgbToCss(s.accent3));

  // Base bg always dark (UI is built for dark)
  root.style.setProperty("--gt-bg", "#050508");

  // if upload mode, set a css var we can use
  if (s.mode === "upload" && s.uploadDataUrl) {
    root.style.setProperty("--gt-wallpaper", `url("${s.uploadDataUrl}")`);
    root.style.setProperty("--gt-wallpaper-mode", "upload");
  } else {
    root.style.setProperty("--gt-wallpaper", "");
    root.style.setProperty("--gt-wallpaper-mode", "preset");
  }
}

function safeParse(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function extractPaletteFromImage(
  dataUrl: string
): Promise<Pick<WallpaperState, "accent" | "accent2" | "accent3">> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unsupported");

  // Downscale for speed
  const w = 90;
  const h = Math.round((img.height / img.width) * w) || 90;
  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  let rSum = 0,
    gSum = 0,
    bSum = 0,
    n = 0;

  let best = { r: 140, g: 80, b: 200, score: -1 };
  let best2 = { r: 80, g: 130, b: 220, score: -1 };

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 40) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // ignore near-black pixels (prevents gray accents)
    if (r + g + b < 75) continue;

    rSum += r;
    gSum += g;
    bSum += b;
    n++;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    const bright = (r + g + b) / 3;

    const score = sat * 1.25 + bright * 0.55;
    if (score > best.score) best = { r, g, b, score };

    const score2 = sat * 1.0 + bright * 0.45 + (b > r ? 14 : 0) + (g > r ? 8 : 0);
    if (score2 > best2.score) best2 = { r, g, b, score: score2 };
  }

  const avg: [number, number, number] = n
    ? [Math.round(rSum / n), Math.round(gSum / n), Math.round(bSum / n)]
    : [140, 80, 200];

  const accent: [number, number, number] = [best.r, best.g, best.b];
  const accent2: [number, number, number] = [best2.r, best2.g, best2.b];

  // warm-ish third accent derived from avg
  const accent3: [number, number, number] = [
    clamp(avg[0] + 45),
    clamp(avg[1] - 5),
    clamp(avg[2] - 35),
  ];

  return { accent, accent2, accent3 };
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WallpaperState>(DEFAULT);

  // load stored on mount
  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    const parsed = safeParse(raw);

    if (parsed && typeof parsed === "object") {
      const next: WallpaperState = { ...DEFAULT, ...parsed };
      setState(next);
      applyCssVars(next);
      return;
    }

    applyCssVars(DEFAULT);
  }, []);

  // keep vars + storage synced
  useEffect(() => {
    applyCssVars(state);
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const api = useMemo<Ctx>(() => {
    return {
      state,
      setPreset: (preset) =>
        setState((s) => ({
          ...s,
          mode: "preset",
          preset,
          uploadDataUrl: null,
        })),

      setUpload: async (dataUrl) => {
        try {
          const pal = await extractPaletteFromImage(dataUrl);
          setState((s) => ({
            ...s,
            mode: "upload",
            uploadDataUrl: dataUrl,
            ...pal,
          }));
        } catch {
          setState((s) => ({
            ...s,
            mode: "upload",
            uploadDataUrl: dataUrl,
          }));
        }
      },

      clearUpload: () =>
        setState((s) => ({
          ...s,
          mode: "preset",
          uploadDataUrl: null,
        })),
    };
  }, [state]);

  return <WallpaperContext.Provider value={api}>{children}</WallpaperContext.Provider>;
}

export function useWallpaper() {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error("useWallpaper must be used inside <WallpaperProvider>");
  return ctx;
}

export function BackgroundLayer() {
  const { state } = useWallpaper();

  const presetClass: Record<PresetId, string> = {
    amethyst:
      "bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(168,85,247,0.45),transparent_60%),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.35),transparent_60%),radial-gradient(700px_500px_at_60%_85%,rgba(239,68,68,0.16),transparent_60%),linear-gradient(180deg,#050508,#060612)]",
    crimson:
      "bg-[radial-gradient(1000px_600px_at_20%_25%,rgba(239,68,68,0.38),transparent_60%),radial-gradient(900px_500px_at_80%_40%,rgba(168,85,247,0.23),transparent_60%),linear-gradient(180deg,#050508,#080610)]",
    deep_ocean:
      "bg-[radial-gradient(1100px_700px_at_20%_20%,rgba(59,130,246,0.35),transparent_60%),radial-gradient(900px_600px_at_80%_35%,rgba(14,165,233,0.22),transparent_60%),linear-gradient(180deg,#04070a,#05050a)]",
    nebula:
      "bg-[radial-gradient(1100px_650px_at_20%_25%,rgba(168,85,247,0.38),transparent_60%),radial-gradient(900px_550px_at_75%_35%,rgba(14,165,233,0.22),transparent_60%),radial-gradient(900px_550px_at_50%_85%,rgba(244,63,94,0.14),transparent_65%),linear-gradient(180deg,#050508,#070715)]",
    midnight:
      "bg-[radial-gradient(900px_500px_at_25%_30%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(1000px_700px_at_75%_35%,rgba(59,130,246,0.16),transparent_65%),linear-gradient(180deg,#040407,#050508)]",
    ember:
      "bg-[radial-gradient(1000px_650px_at_25%_25%,rgba(244,63,94,0.24),transparent_60%),radial-gradient(900px_550px_at_80%_35%,rgba(249,115,22,0.16),transparent_62%),linear-gradient(180deg,#050508,#0a0507)]",
    ultraviolet:
      "bg-[radial-gradient(1050px_650px_at_15%_22%,rgba(192,38,211,0.30),transparent_60%),radial-gradient(950px_600px_at_80%_35%,rgba(37,99,235,0.22),transparent_62%),radial-gradient(900px_650px_at_55%_85%,rgba(239,68,68,0.14),transparent_70%),linear-gradient(180deg,#050508,#060612)]",
  };

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {state.mode === "upload" && state.uploadDataUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${state.uploadDataUrl}")` }}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_38%,transparent_70%)] bg-black/65" />
        </>
      ) : (
        <>
          <div className={`absolute inset-0 ${presetClass[state.preset]}`} />
          <div className="absolute inset-0 opacity-[0.08] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22300%22 height=%22300%22 filter=%22url(%23n)%22 opacity=%220.45%22/></svg>')]" />
          <div className="absolute inset-0 bg-black/35" />
        </>
      )}
    </div>
  );
}
