import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "./_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Ghost Typer – AI Text & Image Detector",
  description: "Detect AI-generated text and images instantly.",
  verification: {
    google: "ABC123XYZ", // 👈 paste ONLY the content value
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
