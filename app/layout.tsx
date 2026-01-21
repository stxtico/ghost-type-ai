import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "./_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Ghost Typer",
  description: "AI text and image detection tools.",
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
