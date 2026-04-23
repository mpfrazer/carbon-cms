import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { apiGet } from "@/lib/api/client";
import type { Metadata } from "next";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const { siteTitle, siteDescription, siteUrl } = await getSiteSettings();
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const url = page === 1 ? `${base}/blog` : `${base}/blog?page=${page}`;
  return {
    title: "Blog",
    description: siteDescription,
    alternates: { canonical: url, types: { "application/rss+xml": `${base}/rss.xml` } },
    openGraph: { type: "website", url, title: `Blog — ${siteTitle}`, description: siteDescription, siteName: siteTitle },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [{ BlogIndex }, { siteTitle, siteDescription, siteUrl, postsPerPage }] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
  ]);

  const pageSize = postsPerPage || 10;
  const { data: rows, pagination } = await apiGet(
    `/api/v1/posts?status=published&page=${page}&pageSize=${pageSize}`
  ) as { data: unknown[]; pagination: { total: number; totalPages: number } };

  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const jsonLd = { "@context": "https://schema.org", "@type": "Blog", name: `Blog — ${siteTitle}`, description: siteDescription, url: `${base}/blog` };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogIndex posts={rows} page={page} totalPages={pagination.totalPages} />
    </>
  );
}
