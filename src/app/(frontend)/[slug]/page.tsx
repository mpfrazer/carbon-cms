import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PageContent } from "@/themes/default/page";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([
    db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.status, "published"))).limit(1).then(r => r[0]),
    getSiteSettings(),
  ]);
  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const url = `${base}/${slug}`;
  const title = page?.metaTitle ?? (page ? `${page.title} — ${settings.siteTitle}` : settings.siteTitle);
  const description = page?.metaDescription ?? settings.siteDescription;

  return {
    title: page?.metaTitle ?? page?.title ?? settings.siteTitle,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: settings.siteTitle },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params;
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.status, "published"))).limit(1).then(r => r[0]),
  ]);
  if (!page) notFound();

  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.metaDescription ?? settings.siteDescription,
    url: `${base}/${slug}`,
    dateModified: page.updatedAt.toISOString(),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageContent title={page.title} content={page.content} updatedAt={page.updatedAt} />
    </>
  );
}
