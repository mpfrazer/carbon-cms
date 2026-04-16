import { NextRequest } from "next/server";
import { asc, eq, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { ok, created, badRequest, conflict, serverError, paginated, parsePagination } from "@/lib/api/response";
import { slugify } from "@/lib/utils";

const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.name)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(categories),
    ]);

    return paginated(rows, total, page, pageSize);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { name, slug: rawSlug, ...rest } = parsed.data;
    const slug = rawSlug ?? slugify(name);

    const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
    if (existing.length > 0) return conflict(`Slug "${slug}" is already in use`);

    const [category] = await db.insert(categories).values({ name, slug, ...rest }).returning();
    return created(category);
  } catch {
    return serverError();
  }
}
