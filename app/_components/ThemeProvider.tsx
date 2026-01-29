"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyThemeToDom(theme: Theme) {
  const root = document.documentElement;

  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  root.style.colorScheme = theme;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // initial load
  useEffect(() => {
    const stored = window.localStorage.getItem("gt_theme");
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
      applyThemeToDom(stored);
      return;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
    const initial: Theme = prefersDark ? "dark" : "light";
    setThemeState(initial);
    applyThemeToDom(initial);
  }, []);

  // keep DOM synced with state
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  // follow system theme ONLY if user never picked a theme
  useEffect(() => {
    const stored = window.localStorage.getItem("gt_theme");
    if (stored === "dark" || stored === "light") return;

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const onChange = () => {
      const next: Theme = mq.matches ? "dark" : "light";
      setThemeState(next);
    };

    // Safari compat
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const setTheme = (t: Theme) => {
    window.localStorage.setItem("gt_theme", t);
    setThemeState(t);
  };

  const toggle = () => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem("gt_theme", next);
      return next;
    });
  };

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
