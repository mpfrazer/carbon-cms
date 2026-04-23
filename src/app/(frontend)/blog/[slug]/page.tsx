import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/lib/db";
import { posts, categories, tags, postCategories, postTags, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, { siteTitle, siteDescription, siteUrl }] = await Promise.all([
    db.select().from(posts).where(eq(posts.slug, slug)).limit(1).then((r) => r[0] ?? null),
    getSiteSettings(),
  ]);
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  if (!post) return { title: siteTitle };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? siteDescription,
    alternates: { canonical: `${base}/blog/${slug}` },
    openGraph: { type: "article", url: `${base}/blog/${slug}`, title: post.metaTitle ?? post.title, description: post.metaDescription ?? post.excerpt ?? siteDescription, siteName: siteTitle, publishedTime: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(), modifiedTime: post.updatedAt.toISOString() },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  if (!post || post.status !== "published") notFound();

  const [{ BlogPost }, { siteTitle, siteDescription, siteUrl }, postCats, postTagRows, authorRow] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    db.select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, post.id)),
    db.select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
    db.select({ name: users.name }).from(users).where(eq(users.id, post.authorId)).limit(1),
  ]);

  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const jsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, description: post.excerpt ?? siteDescription,
    url: `${base}/blog/${slug}`,
    datePublished: post.publishedAt ?? post.createdAt, dateModified: post.updatedAt,
    publisher: { "@type": "Organization", name: siteTitle },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/blog/${slug}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPost
        title={post.title}
        content={post.content}
        publishedAt={post.publishedAt}
        createdAt={post.createdAt}
        authorName={authorRow[0]?.name ?? null}
        categories={postCats}
        tags={postTagRows}
      />
    </>
  );
}
