import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { apiGet } from "@/lib/api/client";
import type { Metadata } from "next";

interface Category { id: string; name: string; slug: string }
interface Tag { id: string; name: string; slug: string }
interface Post {
  id: string; title: string; slug: string; content: string; status: string;
  excerpt: string | null; metaTitle: string | null; metaDescription: string | null;
  publishedAt: string | null; createdAt: string; updatedAt: string;
  authorId: string; categories: Category[]; tags: Tag[];
}

type Props = { params: Promise<{ slug: string }> };

async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    // First find by slug, then fetch full post with relations by ID
    const { data: basic } = await apiGet(`/api/v1/posts?slug=${encodeURIComponent(slug)}&status=published`) as { data: Post | null };
    if (!basic) return null;
    const { data: full } = await apiGet(`/api/v1/posts/${basic.id}`) as { data: Post };
    return full;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, { siteTitle, siteDescription, siteUrl }] = await Promise.all([
    getPostBySlug(slug),
    getSiteSettings(),
  ]);
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  if (!post) return { title: siteTitle };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? siteDescription,
    alternates: { canonical: `${base}/blog/${slug}` },
    openGraph: {
      type: "article", url: `${base}/blog/${slug}`,
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? siteDescription,
      siteName: siteTitle,
      publishedTime: post.publishedAt ?? post.createdAt,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [{ BlogPost }, { siteTitle, siteDescription, siteUrl }, post] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    getPostBySlug(slug),
  ]);

  if (!post) notFound();

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
        publishedAt={post.publishedAt ? new Date(post.publishedAt) : null}
        createdAt={new Date(post.createdAt)}
        authorName={null}
        categories={post.categories}
        tags={post.tags}
      />
    </>
  );
}
