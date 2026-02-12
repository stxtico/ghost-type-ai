// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/app/_components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://ghosttyper.com"), // change later if needed
  title: {
    default: "Ghost Typer",
    template: "%s | Ghost Typer",
  },
  description:
    "Ghost Typer helps you humanize AI text and type naturally with adjustable speed, pauses, and mistakes. Includes AI detection for text and images.",
  applicationName: "Ghost Typer",

  // ✅ Favicons / App Icons
  icons: {
    // Browser tab icon
    icon: [
      { url: "/favicon.png" }, // most important (works everywhere)
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    // iOS home screen icon
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],

    // Optional: Android/Chrome PWA style icon
    other: [{ rel: "icon", url: "/icon.png", type: "image/png", sizes: "512x512" }],
  },

  openGraph: {
    type: "website",
    siteName: "Ghost Typer",
    title: "Ghost Typer",
    description: "Humanize AI text, type naturally, and detect AI in text & images.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ghost Typer" }],
  },

  twitter: {
    card: "summary_large_image",
    title: "Ghost Typer",
    description: "Humanize AI text, type naturally, and detect AI in text & images.",
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
