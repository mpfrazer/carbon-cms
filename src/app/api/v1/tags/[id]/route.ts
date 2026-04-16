import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { ok, badRequest, notFound, conflict, noContent, serverError } from "@/lib/api/response";
import { slugify } from "@/lib/utils";

const updateTagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [tag] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    if (!tag) return notFound("Tag not found");
    return ok(tag);
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
    if (!existing) return notFound("Tag not found");

    const { name, slug: rawSlug } = parsed.data;
    let slug = rawSlug;
    if (name && !slug) slug = slugify(name);

    if (slug && slug !== existing.slug) {
      const [slugConflict] = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
      if (slugConflict) return conflict(`Slug "${slug}" is already in use`);
    }

    const [updated] = await db
      .update(tags)
      .set({ ...(name ? { name } : {}), ...(slug ? { slug } : {}) })
      .where(eq(tags.id, id))
      .returning();

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: tags.id }).from(tags).where(eq(tags.id, id)).limit(1);
    if (!existing) return notFound("Tag not found");
    await db.delete(tags).where(eq(tags.id, id));
    return noContent();
  } catch {
    return serverError();
  }
}
