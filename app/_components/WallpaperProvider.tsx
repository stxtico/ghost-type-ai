"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeState = {
  wallpaperUrl: string | null; // can be: dataURL OR "__css__:<gradient>"
  accent1: string;
  accent2: string;
  accent3: string;
};

type Ctx = ThemeState & {
  setTheme: (next: Partial<ThemeState>) => void;
  resetTheme: () => void;
};

const DEFAULT_THEME: ThemeState = {
  wallpaperUrl: null,
  accent1: "#ef4444",
  accent2: "#a855f7",
  accent3: "#3b82f6",
};

const STORAGE_KEY = "gt_theme_wallpaper_v1";
const WallpaperContext = createContext<Ctx | null>(null);

function applyToDom(state: ThemeState) {
  const root = document.documentElement;

  root.style.setProperty("--gt-accent-1", state.accent1);
  root.style.setProperty("--gt-accent-2", state.accent2);
  root.style.setProperty("--gt-accent-3", state.accent3);

  // IMPORTANT:
  // --gt-wallpaper must be a valid CSS background layer:
  // - "none"
  // - 'url("...")'
  // - 'radial-gradient(...)' etc
  const w = state.wallpaperUrl;

  if (!w) {
    root.style.setProperty("--gt-wallpaper", "none");
    return;
  }

  if (w.startsWith("__css__:")) {
    root.style.setProperty("--gt-wallpaper", w.slice("__css__:".length));
    return;
  }

  // assume it's an image URL/dataURL
  root.style.setProperty("--gt-wallpaper", `url("${w}")`);
}

function safeParse(raw: string | null): ThemeState | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object") return null;

    const st: ThemeState = {
      wallpaperUrl: typeof j.wallpaperUrl === "string" ? j.wallpaperUrl : null,
      accent1: typeof j.accent1 === "string" ? j.accent1 : DEFAULT_THEME.accent1,
      accent2: typeof j.accent2 === "string" ? j.accent2 : DEFAULT_THEME.accent2,
      accent3: typeof j.accent3 === "string" ? j.accent3 : DEFAULT_THEME.accent3,
    };
    return st;
  } catch {
    return null;
  }
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(DEFAULT_THEME);

  useEffect(() => {
    const saved = safeParse(window.localStorage.getItem(STORAGE_KEY));
    const next = saved ?? DEFAULT_THEME;
    setState(next);
    applyToDom(next);
  }, []);

  const setTheme = (next: Partial<ThemeState>) => {
    setState((prev) => {
      const merged: ThemeState = { ...prev, ...next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      applyToDom(merged);
      return merged;
    });
  };

  const resetTheme = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_THEME);
    applyToDom(DEFAULT_THEME);
  };

  const value = useMemo(() => ({ ...state, setTheme, resetTheme }), [state]);

  return <WallpaperContext.Provider value={value}>{children}</WallpaperContext.Provider>;
}

export function useWallpaper() {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error("useWallpaper must be used inside <WallpaperProvider>");
  return ctx;
}
