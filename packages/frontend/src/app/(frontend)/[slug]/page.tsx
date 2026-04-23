import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { apiGet } from "@/lib/api/client";
import type { Metadata } from "next";

interface Page {
  id: string; title: string; slug: string; content: string; status: string;
  metaTitle: string | null; metaDescription: string | null; updatedAt: string;
}

type Props = { params: Promise<{ slug: string }> };

async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const { data } = await apiGet(`/api/v1/pages?slug=${encodeURIComponent(slug)}`) as { data: Page | null };
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, { siteTitle, siteDescription, siteUrl }] = await Promise.all([
    getPageBySlug(slug),
    getSiteSettings(),
  ]);
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  return {
    title: page?.metaTitle ?? page?.title ?? siteTitle,
    description: page?.metaDescription ?? siteDescription,
    alternates: { canonical: `${base}/${slug}` },
    openGraph: { type: "website", url: `${base}/${slug}`, title: page?.metaTitle ?? page?.title ?? siteTitle, description: page?.metaDescription ?? siteDescription, siteName: siteTitle },
  };
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params;

  const [{ PageContent }, { siteTitle, siteDescription, siteUrl }, page] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    getPageBySlug(slug),
  ]);

  if (!page || page.status !== "published") notFound();

  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.metaDescription ?? siteDescription, url: `${base}/${slug}`, dateModified: page.updatedAt };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageContent title={page.title} content={page.content} updatedAt={new Date(page.updatedAt)} />
    </>
  );
}
