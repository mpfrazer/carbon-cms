import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts, users, postCategories, postTags, categories, tags } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { BlogPost } from "@/themes/default/blog-post";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [postRow, settings] = await Promise.all([
    db.select({ post: posts, authorName: users.name })
      .from(posts).leftJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1).then(r => r[0]),
    getSiteSettings(),
  ]);
  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const url = `${base}/blog/${slug}`;

  if (!postRow) return { title: settings.siteTitle };

  const { post, authorName } = postRow;
  const title = post.metaTitle ?? `${post.title} — ${settings.siteTitle}`;
  const description = post.metaDescription ?? post.excerpt ?? settings.siteDescription;

  return {
    title: post.metaTitle ?? post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: settings.siteTitle,
      publishedTime: (post.publishedAt ?? post.createdAt).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: authorName ? [authorName] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [settings, postRow] = await Promise.all([
    getSiteSettings(),
    db.select({ post: posts, authorName: users.name })
      .from(posts).leftJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1).then(r => r[0]),
  ]);

  if (!postRow) notFound();

  const { post, authorName } = postRow;
  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";

  const [postCats, postTagRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(postCategories).innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, post.id)),
    db.select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags).innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.metaDescription ?? settings.siteDescription,
    url: `${base}/blog/${slug}`,
    datePublished: (post.publishedAt ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: authorName ? { "@type": "Person", name: authorName } : undefined,
    publisher: { "@type": "Organization", name: settings.siteTitle },
    keywords: postTagRows.map((t) => t.name).join(", ") || undefined,
    articleSection: postCats.map((c) => c.name).join(", ") || undefined,
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
        authorName={authorName ?? null}
        categories={postCats}
        tags={postTagRows}
      />
    </>
  );
}
