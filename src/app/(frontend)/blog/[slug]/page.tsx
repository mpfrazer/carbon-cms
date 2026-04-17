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
  const [post, settings] = await Promise.all([
    db.select().from(posts).where(and(eq(posts.slug, slug), eq(posts.status, "published"))).limit(1).then(r => r[0]),
    getSiteSettings(),
  ]);
  return {
    title: post?.metaTitle ?? (post ? `${post.title} — ${settings.siteTitle}` : settings.siteTitle),
    description: post?.metaDescription ?? post?.excerpt ?? settings.siteDescription,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [postRow] = await db
    .select({ post: posts, authorName: users.name })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!postRow) notFound();

  const { post, authorName } = postRow;

  const [postCats, postTagRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, post.id)),
    db.select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
  ]);

  return (
    <BlogPost
      title={post.title}
      content={post.content}
      publishedAt={post.publishedAt}
      createdAt={post.createdAt}
      authorName={authorName ?? null}
      categories={postCats}
      tags={postTagRows}
    />
  );
}
