import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ghosttyper.com"; // change to your domain / vercel url

  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/download`, lastModified: new Date() },
    { url: `${base}/billing`, lastModified: new Date() },
    { url: `${base}/themes`, lastModified: new Date() },
    { url: `${base}/account`, lastModified: new Date() },
  ];
}
