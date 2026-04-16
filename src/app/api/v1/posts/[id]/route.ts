import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { ok, badRequest, notFound, conflict, noContent, serverError } from "@/lib/api/response";
import { slugify } from "@/lib/utils";

const updatePostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
  featuredImageId: z.string().uuid().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return notFound("Post not found");
    return ok(post);
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!existing) return notFound("Post not found");

    const { title, slug: rawSlug, ...rest } = parsed.data;
    let slug = rawSlug;

    if (title && !slug) slug = slugify(title);

    if (slug && slug !== existing.slug) {
      const [slugConflict] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
      if (slugConflict) return conflict(`Slug "${slug}" is already in use`);
    }

    const [updated] = await db
      .update(posts)
      .set({ ...(title ? { title } : {}), ...(slug ? { slug } : {}), ...rest, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!existing) return notFound("Post not found");
    await db.delete(posts).where(eq(posts.id, id));
    return noContent();
  } catch {
    return serverError();
  }
}
