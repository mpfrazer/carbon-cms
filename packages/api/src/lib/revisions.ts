import { db } from "@/lib/db";
import { revisions } from "@/lib/db/schema";

export async function saveRevision(
  contentType: "post" | "page",
  contentId: string,
  snapshot: Record<string, unknown>,
  savedBy: string | null | undefined
) {
  await db.insert(revisions).values({
    contentType,
    contentId,
    snapshot: JSON.stringify(snapshot),
    savedBy: savedBy ?? null,
  });
}
