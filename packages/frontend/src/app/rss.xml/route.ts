import { apiGet } from "@/lib/api";

export async function GET() {
  const [settingsRes, postsRes] = await Promise.all([
    apiGet<{ data: { siteTitle?: string; siteDescription?: string; siteUrl?: string } }>("/api/v1/settings?keys=siteTitle,siteDescription,siteUrl"),
    apiGet<{ data: { title: string; slug: string; excerpt: string | null; content: string; publishedAt: string | null; createdAt: string }[] }>("/api/v1/posts?status=published&pageSize=20"),
  ]);
  const s = settingsRes.data ?? {};
  const base = (s.siteUrl || process.env.NEXTAUTH_URL || "http://localhost:3003").replace(/\/$/, "");

  const items = (postsRes.data ?? []).map((post) => {
    const date = new Date(post.publishedAt ?? post.createdAt).toUTCString();
    const url = `${base}/blog/${post.slug}`;
    const description = post.excerpt ? `<![CDATA[${post.excerpt}]]>` : `<![CDATA[${post.content.replace(/<[^>]+>/g, "").slice(0, 280)}…]]>`;
    return `<item><title><![CDATA[${post.title}]]></title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${date}</pubDate><description>${description}</description></item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title><![CDATA[${s.siteTitle ?? ""}]]></title><link>${base}</link><description><![CDATA[${s.siteDescription ?? ""}]]></description><language>en</language><atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "s-maxage=3600, stale-while-revalidate" } });
}
