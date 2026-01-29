"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemePreset = {
  id: string;
  name: string;
  background: string; // ✅ can be a CSS gradient OR url(...)
};

type ThemeState = {
  presetId: string;
  background: string;
  c1: string;
  c2: string;
  c3: string;
};

type ThemeCtx = {
  theme: ThemeState;
  presets: ThemePreset[];
  setPreset: (id: string) => void;
  setCustomImage: (file: File) => Promise<void>;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

const STORAGE_KEY = "gt_theme_v3";

/**
 * ✅ Apple-like “stock wallpaper” gradients
 * - dark-friendly
 * - lots of color stops (keeps the rich look)
 * - layered like Apple wallpapers
 */
const PRESETS: ThemePreset[] = [
  {
    id: "apple-graphite",
    name: "Graphite Waves",
    background: `
      radial-gradient(1200px 900px at 70% 30%, rgba(120,160,150,0.18), transparent 60%),
      radial-gradient(900px 700px at 25% 75%, rgba(120,160,150,0.10), transparent 65%),
      radial-gradient(700px 500px at 65% 75%, rgba(80,120,110,0.14), transparent 60%),
      linear-gradient(135deg,
        #050607 0%,
        #07090b 12%,
        #0a0e10 25%,
        #0f1416 38%,
        #0b0f10 52%,
        #07090b 66%,
        #050607 100%
      )
    `,
  },
  {
    id: "apple-solar",
    name: "Solar Melt",
    background: `
      radial-gradient(900px 650px at 78% 18%, rgba(255,90,40,0.55), transparent 58%),
      radial-gradient(900px 650px at 58% 55%, rgba(170,25,120,0.45), transparent 60%),
      radial-gradient(900px 650px at 38% 72%, rgba(110,20,150,0.35), transparent 62%),
      radial-gradient(900px 650px at 65% 90%, rgba(255,40,95,0.30), transparent 62%),
      linear-gradient(135deg,
        #06040a 0%,
        #11071f 18%,
        #2a0a3a 34%,
        #4a0e44 48%,
        #7a1a33 62%,
        #c52c1f 78%,
        #ff4a22 100%
      )
    `,
  },
  {
    id: "apple-spectrum",
    name: "Spectrum Flow",
    background: `
      radial-gradient(900px 650px at 70% 20%, rgba(0,170,255,0.40), transparent 60%),
      radial-gradient(900px 650px at 55% 60%, rgba(255,60,150,0.32), transparent 62%),
      radial-gradient(900px 650px at 35% 70%, rgba(255,160,0,0.22), transparent 62%),
      radial-gradient(900px 650px at 20% 35%, rgba(120,70,255,0.28), transparent 62%),
      linear-gradient(135deg,
        #05040a 0%,
        #071236 20%,
        #1f165a 38%,
        #3b1464 52%,
        #5d123d 66%,
        #7b2b2b 80%,
        #08101c 100%
      )
    `,
  },
  {
    id: "apple-deep-blue",
    name: "Deep Blue",
    background: `
      radial-gradient(1000px 700px at 70% 25%, rgba(0,110,255,0.28), transparent 62%),
      radial-gradient(1000px 700px at 40% 70%, rgba(0,220,255,0.16), transparent 65%),
      radial-gradient(800px 600px at 25% 40%, rgba(140,80,255,0.14), transparent 62%),
      linear-gradient(135deg,
        #03040a 0%,
        #04081d 18%,
        #061037 34%,
        #07164a 50%,
        #07143a 66%,
        #04081d 82%,
        #03040a 100%
      )
    `,
  },
  {
    id: "apple-redline",
    name: "Redline",
    background: `
      linear-gradient(0deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02)),
      radial-gradient(900px 650px at 75% 25%, rgba(255,70,70,0.35), transparent 60%),
      radial-gradient(900px 650px at 45% 65%, rgba(255,0,90,0.22), transparent 62%),
      radial-gradient(700px 520px at 25% 40%, rgba(255,150,0,0.14), transparent 62%),
      linear-gradient(135deg,
        #050507 0%,
        #0a0507 20%,
        #16050a 40%,
        #23070d 58%,
        #12060a 78%,
        #050507 100%
      )
    `,
  },
  {
    id: "apple-violet-noir",
    name: "Violet Noir",
    background: `
      radial-gradient(950px 700px at 72% 22%, rgba(160,90,255,0.38), transparent 60%),
      radial-gradient(950px 700px at 48% 55%, rgba(70,140,255,0.20), transparent 62%),
      radial-gradient(950px 700px at 30% 75%, rgba(255,70,170,0.16), transparent 62%),
      linear-gradient(135deg,
        #04040b 0%,
        #0b0620 22%,
        #1a0b3c 40%,
        #220a2f 58%,
        #0b0620 78%,
        #04040b 100%
      )
    `,
  },
];

function applyThemeToDom(t: ThemeState) {
  const root = document.documentElement;

  // ✅ background can be gradients OR url(...)
  root.style.setProperty("--gt-bg", t.background);

  // palette vars (used by UI accents if you want)
  root.style.setProperty("--gt-c1", t.c1);
  root.style.setProperty("--gt-c2", t.c2);
  root.style.setProperty("--gt-c3", t.c3);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function rgbToHex(r: number, g: number, b: number) {
  const hx = (x: number) => Math.round(x).toString(16).padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}

/**
 * ✅ Extract 3 common-ish colors from an image (uploaded)
 * - works for data URLs
 * - no network / no login needed
 */
async function extract3ColorsFromDataUrl(dataUrl: string): Promise<{ c1: string; c2: string; c3: string } | null> {
  try {
    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("image load failed"));
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = 128;
    const h = 128;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h).data;

    // bucketed colors
    const buckets = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 200) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // ignore near-black / near-white
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (lum < 8 || lum > 245) continue;

      // quantize
      const qr = Math.round(r / 24) * 24;
      const qg = Math.round(g / 24) * 24;
      const qb = Math.round(b / 24) * 24;

      const key = `${qr},${qg},${qb}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (top.length < 3) return null;

    // pick spaced colors (avoid 3 near-identical)
    const parsed = top.map(([k]) => k.split(",").map(Number) as [number, number, number]);

    const dist = (a: [number, number, number], b: [number, number, number]) =>
      Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

    const cA = parsed[0];
    let cB = parsed[1];
    let cC = parsed[2];

    // find a farther B
    for (const c of parsed) {
      if (dist(cA, c) > dist(cA, cB)) cB = c;
    }
    // find a farther C from both
    for (const c of parsed) {
      if (dist(c, cA) + dist(c, cB) > dist(cC, cA) + dist(cC, cB)) cC = c;
    }

    return {
      c1: rgbToHex(cA[0], cA[1], cA[2]),
      c2: rgbToHex(cB[0], cB[1], cB[2]),
      c3: rgbToHex(cC[0], cC[1], cC[2]),
    };
  } catch {
    return null;
  }
}

/**
 * Derive 3 decent “UI colors” from a preset (since it's gradients)
 * We'll just use curated choices per preset id (best looking).
 */
function presetPalette(id: string): { c1: string; c2: string; c3: string } {
  switch (id) {
    case "apple-graphite":
      return { c1: "#0b0f0f", c2: "#1b2322", c3: "#6aa59a" };
    case "apple-solar":
      return { c1: "#120716", c2: "#4a0e44", c3: "#ff4a22" };
    case "apple-spectrum":
      return { c1: "#071236", c2: "#3b1464", c3: "#ff3b6a" };
    case "apple-deep-blue":
      return { c1: "#04081d", c2: "#07164a", c3: "#00aaff" };
    case "apple-redline":
      return { c1: "#0a0507", c2: "#23070d", c3: "#ff4a4a" };
    case "apple-violet-noir":
      return { c1: "#0b0620", c2: "#1a0b3c", c3: "#a05aff" };
    default:
      return { c1: "#0b0f0f", c2: "#1b2322", c3: "#2c3533" };
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(() => {
    const p = PRESETS[0];
    const pal = presetPalette(p.id);
    return { presetId: p.id, background: p.background, ...pal };
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ThemeState;
        if (parsed?.background && parsed?.c1 && parsed?.c2 && parsed?.c3) {
          setTheme(parsed);
          applyThemeToDom(parsed);
          return;
        }
      } catch {}
    }

    const p = PRESETS[0];
    const pal = presetPalette(p.id);
    const next: ThemeState = { presetId: p.id, background: p.background, ...pal };
    setTheme(next);
    applyThemeToDom(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  function persist(next: ThemeState) {
    setTheme(next);
    applyThemeToDom(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const setPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    const pal = presetPalette(p.id);
    persist({ presetId: p.id, background: p.background, ...pal });
  };

  const setCustomImage = async (file: File) => {
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(new Error("file read failed"));
      r.readAsDataURL(file);
    });

    const extracted = await extract3ColorsFromDataUrl(dataUrl);

    // background as CSS:
    // ✅ url(...) + cover + fixed => same behavior as presets
    const bg = `url("${dataUrl}") center / cover no-repeat fixed`;

    const next: ThemeState = {
      presetId: "custom",
      background: bg,
      c1: extracted?.c1 ?? "#0b0f0f",
      c2: extracted?.c2 ?? "#1b2322",
      c3: extracted?.c3 ?? "#2c3533",
    };

    persist(next);
  };

  const value = useMemo<ThemeCtx>(() => ({ theme, presets: PRESETS, setPreset, setCustomImage }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
