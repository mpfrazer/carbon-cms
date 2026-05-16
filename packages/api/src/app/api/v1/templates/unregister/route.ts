import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { templateSchemas } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { clearCompiledCache } from "@/lib/templates";

function isInternalProxy(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}`;
}

const requestSchema = z.object({
  themeId: z.string().min(1).max(128),
});

/**
 * Frontend-only endpoint. Called when a theme deactivates. Drops all
 * template manifests for that theme. Posts using the dropped kinds are
 * preserved — their structured_data stays intact, render falls back per the
 * architecture doc's contract, and re-activation restores rendering.
 */
export async function POST(req: NextRequest) {
  if (!isInternalProxy(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const result = await db
      .delete(templateSchemas)
      .where(eq(templateSchemas.themeId, parsed.data.themeId))
      .returning({ kind: templateSchemas.kind });

    clearCompiledCache();

    return ok({
      themeId: parsed.data.themeId,
      unregistered: result.length,
      kinds: result.map((r) => r.kind),
    });
  } catch (e) {
    return serverError(e);
  }
}
