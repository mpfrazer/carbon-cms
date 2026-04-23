import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { posts, postCategories, postTags, categories, tags } from "@/lib/db/schema";
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
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return notFound("Post not found");

    const [postCats, postTagRows] = await Promise.all([
      db.select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(eq(postCategories.postId, id)),
      db.select({ id: tags.id, name: tags.name, slug: tags.slug })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, id)),
    ]);

    return ok({ ...post, categories: postCats, tags: postTagRows });
  } catch (e) {
    return serverError(e);
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

    const { title, slug: rawSlug, categoryIds, tagIds, publishedAt, scheduledAt, ...rest } = parsed.data;
    let slug = rawSlug;
    if (title && !slug) slug = slugify(title);

    if (slug && slug !== existing.slug) {
      const [slugConflict] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
      if (slugConflict) return conflict(`Slug "${slug}" is already in use`);
    }

    const [updated] = await db
      .update(posts)
      .set({
        ...(title ? { title } : {}), ...(slug ? { slug } : {}), ...rest,
        ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt) : null } : {}),
        ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    // Replace category and tag assignments if provided
    if (categoryIds !== undefined) {
      await db.delete(postCategories).where(eq(postCategories.postId, id));
      if (categoryIds.length > 0) {
        await db.insert(postCategories).values(categoryIds.map((categoryId) => ({ postId: id, categoryId })));
      }
    }
    if (tagIds !== undefined) {
      await db.delete(postTags).where(eq(postTags.postId, id));
      if (tagIds.length > 0) {
        await db.insert(postTags).values(tagIds.map((tagId) => ({ postId: id, tagId })));
      }
    }

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!existing) return notFound("Post not found");
    await db.delete(posts).where(eq(posts.id, id));
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
