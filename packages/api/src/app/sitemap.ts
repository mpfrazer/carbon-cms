import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { posts, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSiteSettings } from "@/lib/site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSiteSettings();
  const base = (siteUrl || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

  const [publishedPosts, publishedPages] = await Promise.all([
    db.select({ slug: posts.slug, updatedAt: posts.updatedAt }).from(posts).where(eq(posts.status, "published")),
    db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.status, "published")),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  const pageRoutes: MetadataRoute.Sitemap = publishedPages
    .filter((p) => p.slug !== "home")
    .map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const postRoutes: MetadataRoute.Sitemap = publishedPosts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...pageRoutes, ...postRoutes];
}
