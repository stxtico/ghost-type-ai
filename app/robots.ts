// app/robots.ts
import type { MetadataRoute } from "next";

function getBaseUrl() {
  // Preferred: set this in Vercel + .env.local
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  // Vercel fallback
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  // Local fallback
  return "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/billing", "/download", "/scans", "/api", "/login", "/auth"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
