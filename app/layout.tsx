// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/app/_components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://ghosttyper.com"), // <-- change to your real domain later
  title: {
    default: "Ghost Typer",
    template: "%s | Ghost Typer",
  },
  description:
    "Ghost Typer helps you humanize AI text and type naturally with adjustable speed, pauses, and mistakes. Includes AI detection for text and images.",
  applicationName: "Ghost Typer",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Ghost Typer",
    title: "Ghost Typer",
    description:
      "Humanize AI text, type naturally, and detect AI in text & images.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ghost Typer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost Typer",
    description:
      "Humanize AI text, type naturally, and detect AI in text & images.",
    images: ["/og.png"],
  },
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
