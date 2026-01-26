import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "./_components/ThemeProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghosttyper.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ghost Typer",
    template: "%s | Ghost Typer",
  },
  description: "AI text and image detection tools. Scan, save results, and rescan anytime.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ghost Typer",
    description: "AI text and image detection tools. Scan, save results, and rescan anytime.",
    url: siteUrl,
    siteName: "Ghost Typer",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
