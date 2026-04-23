import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { ok, badRequest, notFound, conflict, noContent, serverError } from "@/lib/api/response";
import { slugify } from "@/lib/utils";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!category) return notFound("Category not found");
    return ok(category);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) return notFound("Category not found");

    const { name, slug: rawSlug, ...rest } = parsed.data;
    let slug = rawSlug;
    if (name && !slug) slug = slugify(name);

    if (slug && slug !== existing.slug) {
      const [slugConflict] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
      if (slugConflict) return conflict(`Slug "${slug}" is already in use`);
    }

    const [updated] = await db
      .update(categories)
      .set({ ...(name ? { name } : {}), ...(slug ? { slug } : {}), ...rest })
      .where(eq(categories.id, id))
      .returning();

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) return notFound("Category not found");
    await db.delete(categories).where(eq(categories.id, id));
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
