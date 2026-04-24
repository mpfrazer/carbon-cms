import { apiGet } from "@/lib/api/client";
import { getSiteSettings } from "@/lib/site-settings";

interface Post {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  publishedAt: string;
  author: { name: string };
}

async function getAllPublishedPosts(): Promise<Post[]> {
  const results: Post[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const { data, pagination } = (await apiGet(
      `/api/v1/posts?status=published&page=${page}&pageSize=${pageSize}`
    )) as { data: Post[]; pagination: { totalPages: number } };

    results.push(...data);
    if (page >= pagination.totalPages) break;
    page++;
  }

  return results;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export async function GET() {
  const [settings, posts] = await Promise.all([getSiteSettings(), getAllPublishedPosts()]);

  const base = (settings.siteUrl || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  const title = escapeXml(settings.siteTitle);
  const description = escapeXml(settings.siteDescription);
  const buildDate = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const link = `${base}/blog/${post.slug}`;
      const description = post.excerpt
        ? escapeXml(post.excerpt)
        : escapeXml(stripHtml(post.content).slice(0, 280));
      const pubDate = new Date(post.publishedAt).toUTCString();
      const author = escapeXml(post.author?.name ?? "");

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      ${author ? `<author>${author}</author>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${base}/</link>
    <description>${description}</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
