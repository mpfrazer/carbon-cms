import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PageContent } from "@/themes/default/page";
import { getSiteSettings } from "@/lib/site-settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    db.select().from(pages).where(and(eq(pages.slug, "home"), eq(pages.status, "published"))).limit(1).then(r => r[0]),
    getSiteSettings(),
  ]);
  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const title = page?.metaTitle ?? settings.siteTitle;
  const description = page?.metaDescription ?? settings.siteDescription;

  return {
    title: settings.siteTitle,
    description,
    alternates: { canonical: base, types: { "application/rss+xml": `${base}/rss.xml` } },
    openGraph: { type: "website", url: base, title, description, siteName: settings.siteTitle },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    db.select().from(pages).where(and(eq(pages.slug, "home"), eq(pages.status, "published"))).limit(1).then(r => r[0]),
  ]);
  if (!page) notFound();

  const base = settings.siteUrl || process.env.NEXTAUTH_URL || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteTitle,
    description: settings.siteDescription,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/blog?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageContent title={page.title} content={page.content} updatedAt={page.updatedAt} />
    </>
  );
}
