import type { Metadata } from "next";
import "./globals.css";
import Providers from "./_components/Providers";

export const metadata: Metadata = {
  title: "Ghost Typer",
  description: "AI text and image detection tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
