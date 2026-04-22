import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { apiGet } from "@/lib/api";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

interface Post {
  id: string; title: string; slug: string; content: string; excerpt: string | null;
  status: string; publishedAt: string | null; createdAt: string; updatedAt: string;
  metaTitle: string | null; metaDescription: string | null; authorId: string;
  categories?: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [postRes, settingsRes] = await Promise.all([
    apiGet<Post>(`/api/v1/posts/${slug}`).catch(() => null),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
  ]);
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
  if (!postRes) return { title: s.siteTitle };
  return {
    title: postRes.metaTitle ?? postRes.title,
    description: postRes.metaDescription ?? postRes.excerpt ?? s.siteDescription,
    alternates: { canonical: `${base}/blog/${slug}` },
    openGraph: { type: "article", url: `${base}/blog/${slug}`, title: postRes.metaTitle ?? postRes.title, description: postRes.metaDescription ?? postRes.excerpt ?? s.siteDescription, siteName: s.siteTitle, publishedTime: postRes.publishedAt ?? postRes.createdAt, modifiedTime: postRes.updatedAt },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [{ BlogPost }, settingsRes, postRes] = await Promise.all([
    getThemeComponents(),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
    apiGet<Post>(`/api/v1/posts/${slug}`).catch(() => null),
  ]);
  if (!postRes || postRes.status !== "published") notFound();
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";

  const jsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: postRes.title, description: postRes.excerpt ?? s.siteDescription,
    url: `${base}/blog/${slug}`,
    datePublished: postRes.publishedAt ?? postRes.createdAt, dateModified: postRes.updatedAt,
    publisher: { "@type": "Organization", name: s.siteTitle },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/blog/${slug}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPost
        title={postRes.title}
        content={postRes.content}
        publishedAt={postRes.publishedAt ? new Date(postRes.publishedAt) : null}
        createdAt={new Date(postRes.createdAt)}
        authorName={null}
        categories={postRes.categories ?? []}
        tags={postRes.tags ?? []}
      />
    </>
  );
}
