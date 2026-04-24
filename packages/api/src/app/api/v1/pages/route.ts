import { NextRequest } from "next/server";
import { desc, asc, eq, count, and, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { ok, created, badRequest, conflict, serverError, paginated, parsePagination } from "@/lib/api/response";
import { slugify } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhook";

const createPageSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).optional(),
  content: z.string().default(""),
  status: z.enum(["draft", "published"]).default("draft"),
  parentId: z.string().uuid().nullish(),
  featuredImageId: z.string().uuid().nullish(),
  menuOrder: z.number().int().default(0),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // ?hierarchy=true returns a flat list of {id, title} for parent-page selectors
    if (searchParams.get("hierarchy") === "true") {
      const rows = await db
        .select({ id: pages.id, title: pages.title })
        .from(pages)
        .orderBy(asc(pages.title));
      return ok(rows);
    }

    const slug = searchParams.get("slug");
    if (slug) {
      const [p] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
      if (!p) return ok(null);
      return ok(p);
    }

    const { page, pageSize, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions = [];
    if (status) conditions.push(eq(pages.status, status as "draft" | "published"));
    if (search) conditions.push(like(pages.title, `%${search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(pages).where(where).orderBy(desc(pages.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(pages).where(where),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorId = req.headers.get("x-user-id");
    if (!authorId) return badRequest("Authentication required");

    const body = await req.json();
    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { title, slug: rawSlug, ...rest } = parsed.data;
    const slug = rawSlug ?? slugify(title);

    const existing = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).limit(1);
    if (existing.length > 0) return conflict(`Slug "${slug}" is already in use`);

    const [page] = await db.insert(pages).values({ title, slug, authorId, ...rest }).returning();
    dispatchWebhooks("page.created", page);
    if (page.status === "published") dispatchWebhooks("page.published", page);
    return created(page);
  } catch (e) {
    return serverError(e);
  }
}
