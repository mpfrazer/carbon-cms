import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [page, { siteTitle, siteDescription, siteUrl }] = await Promise.all([
    db.select().from(pages).where(eq(pages.slug, slug)).limit(1).then((r) => r[0] ?? null),
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
    db.select().from(pages).where(eq(pages.slug, slug)).limit(1).then((r) => r[0] ?? null),
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
