import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settingsRes, postsRes, pagesRes] = await Promise.all([
    apiGet<{ data: { siteUrl?: string } }>("/api/v1/settings?keys=siteUrl"),
    apiGet<{ data: { slug: string; updatedAt: string }[] }>("/api/v1/posts?status=published&pageSize=200"),
    apiGet<{ data: { slug: string; updatedAt: string }[] }>("/api/v1/pages?status=published&pageSize=200"),
  ]);
  const base = (settingsRes.data?.siteUrl || process.env.NEXTAUTH_URL || "http://localhost:3003").replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];
  const pageRoutes: MetadataRoute.Sitemap = (pagesRes.data ?? []).filter((p) => p.slug !== "home").map((p) => ({ url: `${base}/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly", priority: 0.8 }));
  const postRoutes: MetadataRoute.Sitemap = (postsRes.data ?? []).map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly", priority: 0.7 }));
  return [...staticRoutes, ...pageRoutes, ...postRoutes];
}
