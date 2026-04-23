import { db } from "@/lib/db";
import { posts, pages, comments, users, media } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  try {
    const [
      [{ value: totalPosts }],
      [{ value: publishedPosts }],
      [{ value: totalPages }],
      [{ value: pendingComments }],
      [{ value: totalUsers }],
      [{ value: totalMedia }],
    ] = await Promise.all([
      db.select({ value: count() }).from(posts),
      db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
      db.select({ value: count() }).from(pages),
      db.select({ value: count() }).from(comments).where(eq(comments.status, "pending")),
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(media),
    ]);

    return ok({ totalPosts, publishedPosts, totalPages, pendingComments, totalUsers, totalMedia });
  } catch (e) {
    return serverError(e);
  }
}
