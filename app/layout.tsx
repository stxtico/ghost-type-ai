import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "./_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Ghost Typer - AI Text & Image Detector + Typer",
  description:
    "Ghost Typer is a versatile AI toolset: detect AI in text and images, and use Ghost Typer to type anywhere with customizable speed, pauses, and realistic mistakes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
