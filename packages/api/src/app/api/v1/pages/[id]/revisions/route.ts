import { NextRequest } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { pages, revisions, users } from "@/lib/db/schema";
import { ok, notFound, serverError } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [page] = await db.select({ id: pages.id }).from(pages).where(eq(pages.id, id)).limit(1);
    if (!page) return notFound("Page not found");

    const rows = await db
      .select({
        id: revisions.id,
        snapshot: revisions.snapshot,
        savedAt: revisions.savedAt,
        savedByName: users.name,
      })
      .from(revisions)
      .leftJoin(users, eq(revisions.savedBy, users.id))
      .where(and(eq(revisions.contentType, "page"), eq(revisions.contentId, id)))
      .orderBy(desc(revisions.savedAt))
      .limit(50);

    return ok(rows.map((r) => {
      const snap = JSON.parse(r.snapshot) as { title: string; status: string };
      return { id: r.id, savedAt: r.savedAt, savedByName: r.savedByName, title: snap.title, status: snap.status };
    }));
  } catch (e) {
    return serverError(e);
  }
}
