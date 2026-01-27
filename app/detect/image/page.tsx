import type { Metadata } from "next";
import DetectImageClient from "./DetectImageClient";

export const metadata: Metadata = {
  title: "Ghost Typer – AI Image Detector",
  description:
    "Detect AI probability in images with Ghost Typer. Upload an image to analyze AI likelihood and keep track of usage credits.",
  keywords: ["AI image detector", "AI image checker", "detect AI images", "AI detector", "ghost typer"],
  openGraph: {
    title: "Ghost Typer – AI Image Detector",
    description: "Upload an image and detect AI likelihood. Track your credits and save scans.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghost Typer – AI Image Detector",
    description: "Upload an image and detect AI likelihood. Track credits and save scans.",
  },
};

export default function DetectImagePage() {
  return <DetectImageClient />;
}
