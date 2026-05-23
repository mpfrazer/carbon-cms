import { NextRequest } from "next/server";
import { notInArray, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { listTemplateKinds, listContributedTemplates } from "@/lib/templates";

/**
 * Returns the set of post.template kinds that would render with the fallback
 * (no structured panel) if the named theme were active. Used by the admin's
 * theme-switch confirmation to surface impact before the user commits.
 *
 * Note: a target theme's contributed kinds are only known to the API after
 * it's been activated at least once — themes lazy-register their manifests.
 * That means a theme that has never been active will appear to "lack" all
 * its contributed kinds, even though it would in fact provide them after
 * activation. The admin UI calls this out in the confirmation copy.
 */
export async function GET(req: NextRequest) {
  try {
    const theme = req.nextUrl.searchParams.get("theme");
    if (!theme) return badRequest("theme parameter required");

    const builtin = listTemplateKinds();
    const contributed = (await listContributedTemplates(theme)).map((t) => t.kind);
    const availableKinds = Array.from(new Set([...builtin, ...contributed]));

    // Group posts whose template is NOT in availableKinds. Postgres returns
    // an empty result set when notInArray is fed an empty array, so guard.
    const rows = availableKinds.length === 0
      ? await db
          .select({ kind: posts.template, count: count() })
          .from(posts)
          .groupBy(posts.template)
      : await db
          .select({ kind: posts.template, count: count() })
          .from(posts)
          .where(notInArray(posts.template, availableKinds))
          .groupBy(posts.template);

    const impactedKinds = rows
      .filter((r) => r.count > 0)
      .map((r) => ({ kind: r.kind, count: Number(r.count) }))
      .sort((a, b) => b.count - a.count);

    const totalImpactedPosts = impactedKinds.reduce((sum, r) => sum + r.count, 0);

    return ok({
      theme,
      availableKinds,
      impactedKinds,
      totalImpactedPosts,
    });
  } catch (e) {
    return serverError(e);
  }
}

