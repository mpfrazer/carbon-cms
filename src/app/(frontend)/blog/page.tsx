import { db } from "@/lib/db";
import { posts, users, postCategories, categories } from "@/lib/db/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { BlogIndex } from "@/themes/default/blog-index";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return { title: `Blog — ${settings.siteTitle}`, description: settings.siteDescription };
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const settings = await getSiteSettings();
  const pageSize = settings.postsPerPage;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * pageSize;

  const where = eq(posts.status, "published");

  const [rows, [{ value: total }]] = await Promise.all([
    db.select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      authorName: users.name,
    })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(where)
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(posts).where(where),
  ]);

  // Fetch categories for each post
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

  const postsWithCats = rows.map((p) => ({ ...p, categories: catsByPost[p.id] ?? [] }));
  const totalPages = Math.ceil(total / pageSize);

  return <BlogIndex posts={postsWithCats} page={page} totalPages={totalPages} />;
}
