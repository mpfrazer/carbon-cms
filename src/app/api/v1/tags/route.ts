import { NextRequest } from "next/server";
import { asc, eq, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { ok, created, badRequest, conflict, serverError, paginated, parsePagination } from "@/lib/api/response";
import { slugify } from "@/lib/utils";

const createTagSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(tags).orderBy(asc(tags.name)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(tags),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { name, slug: rawSlug } = parsed.data;
    const slug = rawSlug ?? slugify(name);

    const existing = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (existing.length > 0) return conflict(`Slug "${slug}" is already in use`);

    const [tag] = await db.insert(tags).values({ name, slug }).returning();
    return created(tag);
  } catch (e) {
    return serverError(e);
  }
}
