import type { Metadata } from "next";
import DetectTextClient from "./DetectTextClient";

export const metadata: Metadata = {
  title: "Ghost Typer – AI Text Detector & Humanizer Typing Tool",
  description:
    "Ghost Typer is a versatile AI text detector and human-like typing tool. Detect AI probability, view sentence highlights, and type anywhere with customizable speed, delays, and realistic mistakes.",
  keywords: [
    "AI detector",
    "AI text detector",
    "AI checker",
    "detect AI text",
    "humanizer",
    "typing simulator",
    "ghost typer",
  ],
  openGraph: {
    title: "Ghost Typer – AI Text Detector & Typing Tool",
    description:
      "Detect AI probability with sentence highlights, and use versatile human-like typing tools with customizable speed and realistic mistakes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost Typer – AI Text Detector & Typing Tool",
    description:
      "Detect AI probability with highlights, and type anywhere with customizable human-like typing.",
  },
};

export default function DetectTextPage() {
  return <DetectTextClient />;
}
