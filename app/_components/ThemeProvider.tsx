"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

const STORAGE_KEY = "gt_theme";

function applyThemeClass(theme: Theme) {
  const root = document.documentElement; // <html>
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  if (theme === "dark") root.classList.add("dark");
  // Tailwind uses "dark" class, but we also keep "light" for debugging.
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Initial load (runs once)
  useEffect(() => {
    const saved = (window.localStorage.getItem(STORAGE_KEY) as Theme | null) || null;

    // If no saved preference, use system preference
    const systemPrefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial: Theme = saved ?? (systemPrefersDark ? "dark" : "light");
    setThemeState(initial);
    applyThemeClass(initial);
  }, []);

  // Keep html class + localStorage synced
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyThemeClass(theme);
  }, [theme]);

  const value = useMemo<ThemeCtx>(() => {
    return {
      theme,
      setTheme: (t) => setThemeState(t),
      toggle: () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    };
  }, [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
