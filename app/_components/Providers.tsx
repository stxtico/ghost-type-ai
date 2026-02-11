// app/_components/Providers.tsx
"use client";

import { ThemeProvider } from "@/app/_components/ThemeProvider";
import { LanguageProvider } from "@/app/_components/LanguageProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  );
}
