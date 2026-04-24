import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";
import { canReject } from "@/lib/workflow";
import { dispatchWebhooks } from "@/lib/webhook";
import { sendReviewDecisionEmail } from "@/lib/email";
import { saveRevision } from "@/lib/revisions";

const schema = z.object({ note: z.string().min(1).max(2000) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const role = req.headers.get("x-user-role");
  if (role !== "admin" && role !== "editor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "A note is required when rejecting a post" }, { status: 400 });
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return notFound("Post not found");

    if (!canReject(post.status)) {
      return NextResponse.json({ error: `Cannot reject a "${post.status}" post` }, { status: 422 });
    }

    const [updated] = await db
      .update(posts)
      .set({ status: "draft", reviewNote: parsed.data.note, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    void saveRevision("post", id, {
      title: updated.title, slug: updated.slug, content: updated.content, excerpt: updated.excerpt,
      status: updated.status, featuredImageId: updated.featuredImageId,
      publishedAt: updated.publishedAt, scheduledAt: updated.scheduledAt,
      metaTitle: updated.metaTitle, metaDescription: updated.metaDescription,
    }, req.headers.get("x-user-id"));

    const [author] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1);
    if (author) {
      sendReviewDecisionEmail({
        to: author.email,
        authorName: author.name,
        postTitle: updated.title,
        postId: updated.id,
        decision: "rejected",
        note: parsed.data.note,
      }).catch((err) => console.error("[email] review rejected notification failed:", err));
    }

    dispatchWebhooks("post.rejected", updated);
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
