"use client";

import React from "react";

// ✅ IMPORTANT: your ThemeProvider is a NAMED export
import { ThemeProvider } from "@/app/_components/ThemeProvider";

// If you have these providers, keep them. If not, delete their imports + wrappers.
import { LanguageProvider } from "@/app/_components/LanguageProvider";
import { WallpaperProvider } from "@/app/_components/WallpaperProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <WallpaperProvider>{children}</WallpaperProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
