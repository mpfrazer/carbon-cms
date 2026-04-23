import { NextRequest } from "next/server";
import { desc, eq, count, and, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { posts, postCategories, postTags } from "@/lib/db/schema";
import {
  ok,
  created,
  badRequest,
  conflict,
  serverError,
  paginated,
  parsePagination,
} from "@/lib/api/response";
import { slugify } from "@/lib/utils";

const createPostSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(500).optional(),
  content: z.string().default(""),
  excerpt: z.string().nullish(),
  status: z.enum(["draft", "published", "scheduled", "archived"]).default("draft"),
  featuredImageId: z.string().uuid().nullish(),
  publishedAt: z.string().datetime().nullish(),
  scheduledAt: z.string().datetime().nullish(),
  metaTitle: z.string().nullish(),
  metaDescription: z.string().nullish(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { page, pageSize, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const slug = searchParams.get("slug");

    if (slug) {
      const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
      if (!post) return ok(null);
      return ok(post);
    }

    const conditions = [];
    if (status) conditions.push(eq(posts.status, status as "draft" | "published" | "scheduled" | "archived"));
    if (search) conditions.push(like(posts.title, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(posts).where(where).orderBy(desc(posts.createdAt)).limit(pageSize).offset(offset),
      db.select({ value: count() }).from(posts).where(where),
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
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { title, slug: rawSlug, categoryIds, tagIds, publishedAt, scheduledAt, ...rest } = parsed.data;
    const slug = rawSlug ?? slugify(title);

    const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
    if (existing.length > 0) return conflict(`Slug "${slug}" is already in use`);

    const [post] = await db
      .insert(posts)
      .values({
        title, slug, authorId, ...rest,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      })
      .returning();

    if (categoryIds?.length) {
      await db.insert(postCategories).values(categoryIds.map((categoryId) => ({ postId: post.id, categoryId })));
    }
    if (tagIds?.length) {
      await db.insert(postTags).values(tagIds.map((tagId) => ({ postId: post.id, tagId })));
    }

    return created(post);
  } catch (e) {
    return serverError(e);
  }
}
