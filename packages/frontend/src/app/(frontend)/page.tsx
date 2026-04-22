import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { apiGet } from "@/lib/api";
import type { Metadata } from "next";

interface Page { id: string; title: string; content: string; slug: string; metaTitle: string | null; metaDescription: string | null; updatedAt: string; }

export async function generateMetadata(): Promise<Metadata> {
  const [pageRes, settingsRes] = await Promise.all([
    apiGet<{ data: Page[] }>("/api/v1/pages?status=published&pageSize=1"),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
  ]);
  const page = pageRes.data?.find((p) => p.slug === "home");
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
  return {
    title: s.siteTitle,
    description: page?.metaDescription ?? s.siteDescription,
    alternates: { canonical: base, types: { "application/rss+xml": `${base}/rss.xml` } },
    openGraph: { type: "website", url: base, title: page?.metaTitle ?? s.siteTitle, description: page?.metaDescription ?? s.siteDescription, siteName: s.siteTitle },
  };
}

export default async function HomePage() {
  const [{ PageContent }, settingsRes] = await Promise.all([
    getThemeComponents(),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
  ]);
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";

  const pagesRes = await apiGet<{ data: Page[] }>("/api/v1/pages?status=published&pageSize=50");
  const page = pagesRes.data?.find((p) => p.slug === "home");
  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org", "@type": "WebSite",
    name: s.siteTitle, description: s.siteDescription, url: base,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${base}/blog?search={search_term_string}` }, "query-input": "required name=search_term_string" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageContent title={page.title} content={page.content} updatedAt={new Date(page.updatedAt)} />
    </>
  );
}
