import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, revisions } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";
import { saveRevision } from "@/lib/revisions";

type Params = { params: Promise<{ id: string; revisionId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id, revisionId } = await params;

    const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return notFound("Post not found");

    const [revision] = await db
      .select()
      .from(revisions)
      .where(and(eq(revisions.id, revisionId), eq(revisions.contentType, "post"), eq(revisions.contentId, id)))
      .limit(1);
    if (!revision) return notFound("Revision not found");

    const snap = JSON.parse(revision.snapshot) as {
      title: string; slug: string; content: string; excerpt: string | null;
      status: string; featuredImageId: string | null;
      publishedAt: string | null; scheduledAt: string | null;
      metaTitle: string | null; metaDescription: string | null;
    };

    const [updated] = await db
      .update(posts)
      .set({
        title: snap.title,
        slug: snap.slug,
        content: snap.content,
        excerpt: snap.excerpt ?? null,
        status: snap.status as "draft" | "published" | "scheduled" | "archived",
        featuredImageId: snap.featuredImageId ?? null,
        publishedAt: snap.publishedAt ? new Date(snap.publishedAt) : null,
        scheduledAt: snap.scheduledAt ? new Date(snap.scheduledAt) : null,
        metaTitle: snap.metaTitle ?? null,
        metaDescription: snap.metaDescription ?? null,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning();

    void saveRevision("post", id, snap as unknown as Record<string, unknown>, req.headers.get("x-user-id"));

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
