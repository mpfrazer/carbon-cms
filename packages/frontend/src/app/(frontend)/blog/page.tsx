import { getThemeComponents } from "@/lib/theme-provider";
import { apiGet } from "@/lib/api";
import type { Metadata } from "next";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const settingsRes = await apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl");
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const url = page === 1 ? `${base}/blog` : `${base}/blog?page=${page}`;
  return {
    title: "Blog",
    description: s.siteDescription,
    alternates: { canonical: url, types: { "application/rss+xml": `${base}/rss.xml` } },
    openGraph: { type: "website", url, title: `Blog — ${s.siteTitle}`, description: s.siteDescription, siteName: s.siteTitle },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [{ BlogIndex }, settingsRes, postsRes] = await Promise.all([
    getThemeComponents(),
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string; postsPerPage?: number } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl,postsPerPage"),
    apiGet<{ data: unknown[]; pagination: { total: number; totalPages: number } }>(`/api/v1/posts?status=published&page=${page}&pageSize=${10}`),
  ]);
  const s = settingsRes.data ?? {};
  const base = s.siteUrl || process.env.NEXTAUTH_URL || "";

  const jsonLd = { "@context": "https://schema.org", "@type": "Blog", name: `Blog — ${s.siteTitle}`, url: `${base}/blog` };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogIndex posts={postsRes.data ?? []} page={page} totalPages={postsRes.pagination?.totalPages ?? 1} />
    </>
  );
}
