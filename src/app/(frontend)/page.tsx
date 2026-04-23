import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const [{ siteTitle, siteDescription, siteUrl }, allPages] = await Promise.all([
    getSiteSettings(),
    db.select({ slug: pages.slug, metaTitle: pages.metaTitle, metaDescription: pages.metaDescription })
      .from(pages).where(eq(pages.status, "published")),
  ]);
  const page = allPages.find((p) => p.slug === "home");
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  return {
    title: siteTitle,
    description: page?.metaDescription ?? siteDescription,
    alternates: { canonical: base, types: { "application/rss+xml": `${base}/rss.xml` } },
    openGraph: { type: "website", url: base, title: page?.metaTitle ?? siteTitle, description: page?.metaDescription ?? siteDescription, siteName: siteTitle },
  };
}

export default async function HomePage() {
  const [{ PageContent }, { siteTitle, siteDescription, siteUrl }, allPages] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    db.select().from(pages).where(eq(pages.status, "published")),
  ]);
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const page = allPages.find((p) => p.slug === "home");
  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org", "@type": "WebSite",
    name: siteTitle, description: siteDescription, url: base,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${base}/blog?search={search_term_string}` }, "query-input": "required name=search_term_string" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageContent title={page.title} content={page.content} updatedAt={new Date(page.updatedAt)} />
    </>
  );
}
