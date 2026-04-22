import { notFound } from "next/navigation";
import { getThemeComponents } from "@/lib/theme-provider";
import { apiGet } from "@/lib/api";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

interface Page { id: string; title: string; content: string; slug: string; metaTitle: string | null; metaDescription: string | null; updatedAt: string; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [pagesRes, settingsRes] = await Promise.all([
    apiGet<{ data: Page[] }>(`/api/v1/pages?status=published&pageSize=50`),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
  ]);
  const page = pagesRes.data?.find((p) => p.slug === slug);
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
  return {
    title: page?.metaTitle ?? page?.title ?? s.siteTitle,
    description: page?.metaDescription ?? s.siteDescription,
    alternates: { canonical: `${base}/${slug}` },
    openGraph: { type: "website", url: `${base}/${slug}`, title: page?.metaTitle ?? page?.title ?? s.siteTitle, description: page?.metaDescription ?? s.siteDescription, siteName: s.siteTitle },
  };
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params;
  const [{ PageContent }, settingsRes, pagesRes] = await Promise.all([
    getThemeComponents(),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
    apiGet<{ data: Page[] }>("/api/v1/pages?status=published&pageSize=50"),
  ]);
  const page = pagesRes.data?.find((p) => p.slug === slug);
  if (!page) notFound();
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.metaDescription ?? s.siteDescription, url: `${base}/${slug}`, dateModified: page.updatedAt };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageContent title={page.title} content={page.content} updatedAt={new Date(page.updatedAt)} />
    </>
  );
}
