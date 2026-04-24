import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { media, posts, pages } from "@/lib/db/schema";
import { ok, badRequest, notFound, noContent, serverError } from "@/lib/api/response";
import { deleteFile, keyFromUrl } from "@/lib/storage";

const updateMediaSchema = z.object({
  altText: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (!item) return notFound("Media not found");
    return ok(item);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateMediaSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const [existing] = await db.select({ id: media.id }).from(media).where(eq(media.id, id)).limit(1);
    if (!existing) return notFound("Media not found");

    const [updated] = await db.update(media).set(parsed.data).where(eq(media.id, id)).returning();
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (!item) return notFound("Media not found");

    const [referencingPosts, referencingPages] = await Promise.all([
      db.select({ id: posts.id, title: posts.title }).from(posts).where(eq(posts.featuredImageId, id)),
      db.select({ id: pages.id, title: pages.title }).from(pages).where(eq(pages.featuredImageId, id)),
    ]);

    if (referencingPosts.length > 0 || referencingPages.length > 0) {
      return NextResponse.json(
        { error: "This file is in use and cannot be deleted.", inUse: { posts: referencingPosts, pages: referencingPages } },
        { status: 409 }
      );
    }

    try {
      await deleteFile(keyFromUrl(item.url));
    } catch {
      // Object may already be gone — continue with DB deletion
    }

    await db.delete(media).where(eq(media.id, id));
    return noContent();
  } catch (e) {
    return serverError(e);
  }
}
