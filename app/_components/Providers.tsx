"use client";

import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "./LanguageProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
