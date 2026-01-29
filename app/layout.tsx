import "./globals.css";
import { ThemeProvider } from "@/app/_components/ThemeProvider";
import { LanguageProvider } from "@/app/_components/LanguageProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
