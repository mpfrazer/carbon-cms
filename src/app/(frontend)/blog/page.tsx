import { db } from "@/lib/db";
import { posts, users, postCategories, categories } from "@/lib/db/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { BlogIndex } from "@/themes/default/blog-index";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const settings = await getSiteSettings();
  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const url = page === 1 ? `${base}/blog` : `${base}/blog?page=${page}`;
  const title = `Blog — ${settings.siteTitle}`;

  return {
    title: "Blog",
    description: settings.siteDescription,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": `${base}/rss.xml` },
      ...(page > 1 ? { prev: `${base}/blog${page > 2 ? `?page=${page - 1}` : ""}` } : {}),
    },
    openGraph: { type: "website", url, title, description: settings.siteDescription, siteName: settings.siteTitle },
    twitter: { card: "summary_large_image", title, description: settings.siteDescription },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const settings = await getSiteSettings();
  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const pageSize = settings.postsPerPage;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * pageSize;

  const where = eq(posts.status, "published");

  const [rows, [{ value: total }]] = await Promise.all([
    db.select({ id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt, publishedAt: posts.publishedAt, createdAt: posts.createdAt, authorName: users.name })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(where)
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(posts).where(where),
  ]);

  const postIds = rows.map((r) => r.id);
  const catRows = postIds.length > 0
    ? await db.select({ postId: postCategories.postId, id: categories.id, name: categories.name, slug: categories.slug })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(inArray(postCategories.postId, postIds))
    : [];

  const catsByPost = catRows.reduce<Record<string, typeof catRows>>((acc, row) => {
    (acc[row.postId] ??= []).push(row);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / pageSize);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `Blog — ${settings.siteTitle}`,
    url: `${base}/blog`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Pagination link relations for crawlers */}
      {page > 1 && <link rel="prev" href={`${base}/blog${page > 2 ? `?page=${page - 1}` : ""}`} />}
      {page < totalPages && <link rel="next" href={`${base}/blog?page=${page + 1}`} />}
      <BlogIndex posts={rows.map((p) => ({ ...p, categories: catsByPost[p.id] ?? [] }))} page={page} totalPages={totalPages} />
    </>
  );
}
