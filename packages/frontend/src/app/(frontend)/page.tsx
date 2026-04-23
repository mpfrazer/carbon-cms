import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { getSiteSettings } from "@/lib/site-settings";
import { apiGet } from "@/lib/api/client";
import type { Metadata } from "next";

interface Page { id: string; slug: string; title: string; content: string; status: string; metaTitle: string | null; metaDescription: string | null; updatedAt: string }

export async function generateMetadata(): Promise<Metadata> {
  const [{ siteTitle, siteDescription, siteUrl }, pagesRes] = await Promise.all([
    getSiteSettings(),
    apiGet("/api/v1/pages?status=published&pageSize=50"),
  ]) as [Awaited<ReturnType<typeof getSiteSettings>>, { data: Page[] }];
  const page = pagesRes.data.find((p) => p.slug === "home");
  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  return {
    title: siteTitle,
    description: page?.metaDescription ?? siteDescription,
    alternates: { canonical: base, types: { "application/rss+xml": `${base}/rss.xml` } },
    openGraph: { type: "website", url: base, title: page?.metaTitle ?? siteTitle, description: page?.metaDescription ?? siteDescription, siteName: siteTitle },
  };
}

export default async function HomePage() {
  const [{ PageContent }, { siteTitle, siteDescription, siteUrl }, pagesRes] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    apiGet("/api/v1/pages?status=published&pageSize=50"),
  ]) as [Awaited<ReturnType<typeof getThemeComponents>>, Awaited<ReturnType<typeof getSiteSettings>>, { data: Page[] }];

  const base = siteUrl || process.env.NEXTAUTH_URL || "";
  const page = pagesRes.data.find((p) => p.slug === "home");
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
