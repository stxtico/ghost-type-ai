// app/sitemap.ts
import type { MetadataRoute } from "next";

function getBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  // Only include PUBLIC pages you want indexed
  const routes = [
    "/",              // Landing / marketing page (recommended)
    "/detect/text",
    "/detect/image",
    // add any public SEO pages you create later like:
    // "/ai-detector",
    // "/ai-typer",
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
