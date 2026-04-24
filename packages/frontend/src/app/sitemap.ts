import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api/client";
import { getSiteSettings } from "@/lib/site-settings";

interface Post { slug: string; updatedAt: string; }
interface Page { slug: string; updatedAt: string; }

async function getAllPublishedPosts(): Promise<Post[]> {
  const results: Post[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const { data, pagination } = await apiGet(
      `/api/v1/posts?status=published&page=${page}&pageSize=${pageSize}`
    ) as { data: Post[]; pagination: { totalPages: number } };

    results.push(...data);
    if (page >= pagination.totalPages) break;
    page++;
  }

  return results;
}

async function getAllPublishedPages(): Promise<Page[]> {
  const results: Page[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const { data, pagination } = await apiGet(
      `/api/v1/pages?status=published&page=${page}&pageSize=${pageSize}`
    ) as { data: Page[]; pagination: { totalPages: number } };

    results.push(...data);
    if (page >= pagination.totalPages) break;
    page++;
  }

  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSiteSettings();
  const base = siteUrl || process.env.NEXTAUTH_URL || "";

  const [posts, pages] = await Promise.all([
    getAllPublishedPosts(),
    getAllPublishedPages(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${base}/${page.slug}`,
    lastModified: new Date(page.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...pageRoutes];
}
