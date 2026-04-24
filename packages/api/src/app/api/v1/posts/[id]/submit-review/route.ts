import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";
import { canSubmitForReview } from "@/lib/workflow";
import { dispatchWebhooks } from "@/lib/webhook";
import { sendReviewSubmittedEmail } from "@/lib/email";
import { saveRevision } from "@/lib/revisions";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return notFound("Post not found");

    if (!canSubmitForReview(post.status)) {
      return NextResponse.json({ error: `Cannot submit a "${post.status}" post for review` }, { status: 422 });
    }

    const [updated] = await db
      .update(posts)
      .set({ status: "in_review", reviewNote: null, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    void saveRevision("post", id, {
      title: updated.title, slug: updated.slug, content: updated.content, excerpt: updated.excerpt,
      status: updated.status, featuredImageId: updated.featuredImageId,
      publishedAt: updated.publishedAt, scheduledAt: updated.scheduledAt,
      metaTitle: updated.metaTitle, metaDescription: updated.metaDescription,
    }, userId);

    const [author] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
    sendReviewSubmittedEmail({
      postTitle: updated.title,
      postId: updated.id,
      authorName: author?.name ?? "Someone",
    }).catch((err) => console.error("[email] review submitted notification failed:", err));

    dispatchWebhooks("post.submitted_review", updated);
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
