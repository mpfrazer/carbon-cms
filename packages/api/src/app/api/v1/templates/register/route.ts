import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { templateSchemas } from "@/lib/db/schema";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { clearCompiledCache } from "@/lib/templates";

/**
 * Frontend-only endpoint. Called by the frontend service when a theme
 * activates and exports templates. The frontend converts each Zod schema to
 * JSON Schema via z.toJSONSchema before sending; here we persist the
 * manifests so the API can validate post writes server-side without needing
 * the theme's runtime code.
 *
 * Auth: requires the internal-proxy bearer (AUTH_SECRET). This is the same
 * trust boundary used by the rebuild webhook between API and frontend.
 */
function isInternalProxy(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.AUTH_SECRET}`;
}

const requestSchema = z.object({
  themeId: z.string().min(1).max(128),
  templates: z
    .array(
      z.object({
        kind: z.string().min(1).max(128).regex(/^[a-z][a-z0-9-]*$/, "kind must be lowercase, hyphenated"),
        label: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        jsonSchema: z.record(z.string(), z.unknown()),
      }),
    )
    .max(50),
});

export async function POST(req: NextRequest) {
  if (!isInternalProxy(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());
    const { themeId, templates } = parsed.data;

    // Replace this theme's manifest atomically — delete everything previously
    // registered under themeId, insert the new set. Simpler than diffing and
    // avoids stale rows when a theme drops a template kind between versions.
    await db.transaction(async (tx) => {
      await tx.delete(templateSchemas).where(eq(templateSchemas.themeId, themeId));
      if (templates.length > 0) {
        await tx.insert(templateSchemas).values(
          templates.map((t) => ({
            themeId,
            kind: t.kind,
            label: t.label,
            description: t.description ?? null,
            jsonSchema: t.jsonSchema,
          })),
        );
      }
    });

    // Clear ajv compiled-schema cache for this theme so subsequent writes
    // pick up the new schemas instead of yesterday's compiled version.
    clearCompiledCache();

    return ok({ themeId, registered: templates.length });
  } catch (e) {
    return serverError(e);
  }
}

