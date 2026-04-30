import { NextRequest } from "next/server";
import { sql, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, pages } from "@/lib/db/schema";
import { badRequest, paginated, serverError } from "@/lib/api/response";

const STRIP_HTML = `'<[^>]+>'`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));

    if (!q) return badRequest("q parameter is required");
    if (!["all", "posts", "pages"].includes(type)) return badRequest("type must be all, posts, or pages");

    const isAdmin = req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}`;

    interface Result {
      type: "post" | "page";
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      publishedAt: Date | null;
      url: string;
      rank: number;
    }

    const results: Result[] = [];

    if (type === "all" || type === "posts") {
      const rows = await db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          excerpt: posts.excerpt,
          publishedAt: posts.publishedAt,
          rank: sql<number>`ts_rank(
            setweight(to_tsvector('english', ${posts.title}), 'A') ||
            setweight(to_tsvector('english', coalesce(${posts.excerpt}, '')), 'B') ||
            setweight(to_tsvector('english', regexp_replace(${posts.content}::text, ${sql.raw(STRIP_HTML)}, ' ', 'g')), 'C'),
            plainto_tsquery('english', ${q})
          )`,
        })
        .from(posts)
        .where(and(
          isAdmin ? undefined : eq(posts.status, "published"),
          sql`(
            setweight(to_tsvector('english', ${posts.title}), 'A') ||
            setweight(to_tsvector('english', coalesce(${posts.excerpt}, '')), 'B') ||
            setweight(to_tsvector('english', regexp_replace(${posts.content}::text, ${sql.raw(STRIP_HTML)}, ' ', 'g')), 'C')
          ) @@ plainto_tsquery('english', ${q})`
        ));

      for (const row of rows) {
        results.push({ type: "post", ...row, url: `/blog/${row.slug}`, rank: Number(row.rank) });
      }
    }

    if (type === "all" || type === "pages") {
      const rows = await db
        .select({
          id: pages.id,
          title: pages.title,
          slug: pages.slug,
          createdAt: pages.createdAt,
          rank: sql<number>`ts_rank(
            setweight(to_tsvector('english', ${pages.title}), 'A') ||
            setweight(to_tsvector('english', regexp_replace(${pages.content}::text, ${sql.raw(STRIP_HTML)}, ' ', 'g')), 'C'),
            plainto_tsquery('english', ${q})
          )`,
        })
        .from(pages)
        .where(and(
          isAdmin ? undefined : eq(pages.status, "published"),
          sql`(
            setweight(to_tsvector('english', ${pages.title}), 'A') ||
            setweight(to_tsvector('english', regexp_replace(${pages.content}::text, ${sql.raw(STRIP_HTML)}, ' ', 'g')), 'C')
          ) @@ plainto_tsquery('english', ${q})`
        ));

      for (const row of rows) {
        results.push({
          type: "page",
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: null,
          publishedAt: row.createdAt,
          url: `/${row.slug}`,
          rank: Number(row.rank),
        });
      }
    }

    results.sort((a, b) => b.rank - a.rank);

    const total = results.length;
    const offset = (page - 1) * pageSize;
    const pageData = results.slice(offset, offset + pageSize).map(({ rank: _rank, ...r }) => r);

    return paginated(pageData, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}
