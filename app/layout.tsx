import "./globals.css";

import ThemeProvider from "@/app/_components/ThemeProvider";
import { LanguageProvider } from "@/app/_components/LanguageProvider";
import { WallpaperProvider, BackgroundLayer } from "@/app/_components/WallpaperProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <WallpaperProvider>
          <BackgroundLayer />
          <ThemeProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </ThemeProvider>
        </WallpaperProvider>
      </body>
    </html>
  );
}
