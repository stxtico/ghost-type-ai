"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function applyThemeToDom(t: Theme) {
  // Tailwind dark mode expects "dark" class on <html>
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = t; // helps inputs, scrollbars in some browsers
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Load saved theme, else default to dark
    const saved = (window.localStorage.getItem("gt_theme") || "") as Theme;
    const initial: Theme = saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(initial);
    applyThemeToDom(initial);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    window.localStorage.setItem("gt_theme", t);
    applyThemeToDom(t);
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback (won't crash)
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
