import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
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
  const offset = (page - 1) * pageSize;

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(posts).where(eq(posts.status, "published")).orderBy(desc(posts.publishedAt), desc(posts.createdAt)).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
  ]);

  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const totalPages = Math.ceil(total / pageSize);
  const jsonLd = { "@context": "https://schema.org", "@type": "Blog", name: `Blog — ${siteTitle}`, description: siteDescription, url: `${base}/blog` };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogIndex posts={rows} page={page} totalPages={totalPages} />
    </>
  );
}
