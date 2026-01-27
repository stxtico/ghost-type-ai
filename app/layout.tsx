import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "./_components/ThemeProvider";

export const metadata: Metadata = {
  title: "Ghost Typer – AI Text & Image Detector",
  description: "Detect AI-generated text and images instantly.",
  verification: {
    google: "lqxYAwc8bpxwejKrN1ZJlA7KYlwuz8Ihl66bqx9PH0M", 
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
