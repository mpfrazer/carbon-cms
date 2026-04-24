import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { pages, revisions } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";
import { saveRevision } from "@/lib/revisions";

type Params = { params: Promise<{ id: string; revisionId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id, revisionId } = await params;

    const [page] = await db.select({ id: pages.id }).from(pages).where(eq(pages.id, id)).limit(1);
    if (!page) return notFound("Page not found");

    const [revision] = await db
      .select()
      .from(revisions)
      .where(and(eq(revisions.id, revisionId), eq(revisions.contentType, "page"), eq(revisions.contentId, id)))
      .limit(1);
    if (!revision) return notFound("Revision not found");

    const snap = JSON.parse(revision.snapshot) as {
      title: string; slug: string; content: string;
      status: string; parentId: string | null; featuredImageId: string | null;
      menuOrder: number; metaTitle: string | null; metaDescription: string | null;
    };

    const [updated] = await db
      .update(pages)
      .set({
        title: snap.title,
        slug: snap.slug,
        content: snap.content,
        status: snap.status as "draft" | "published",
        parentId: snap.parentId ?? null,
        featuredImageId: snap.featuredImageId ?? null,
        menuOrder: snap.menuOrder ?? 0,
        metaTitle: snap.metaTitle ?? null,
        metaDescription: snap.metaDescription ?? null,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning();

    void saveRevision("page", id, snap as unknown as Record<string, unknown>, req.headers.get("x-user-id"));

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
