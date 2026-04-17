import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSiteSettings } from "@/lib/site-settings";

export async function GET() {
  const { siteTitle, siteDescription, siteUrl } = await getSiteSettings();
  const base = (siteUrl || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

  const rows = await db
    .select({ post: posts, authorName: users.name })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
    .limit(20);

  const items = rows.map(({ post, authorName }) => {
    const date = new Date(post.publishedAt ?? post.createdAt).toUTCString();
    const url = `${base}/blog/${post.slug}`;
    const description = post.excerpt
      ? `<![CDATA[${post.excerpt}]]>`
      : `<![CDATA[${post.content.replace(/<[^>]+>/g, "").slice(0, 280)}…]]>`;

    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      ${authorName ? `<dc:creator><![CDATA[${authorName}]]></dc:creator>` : ""}
      <description>${description}</description>
      ${post.content ? `<content:encoded><![CDATA[${post.content}]]></content:encoded>` : ""}
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteTitle}]]></title>
    <link>${base}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
