import { and, eq } from "drizzle-orm";
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { db } from "@/lib/db";
import { settings, templateSchemas } from "@/lib/db/schema";

/**
 * Reads the currently-active theme slug from settings, falling back to
 * "default" if unset. Matches the convention used by other API routes
 * (/themes, /themes/[slug], /themes/[slug]/vars).
 */
export async function getActiveThemeId(): Promise<string> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "activeTheme")).limit(1);
  if (!row) return "default";
  try {
    const parsed = JSON.parse(row.value);
    return typeof parsed === "string" && parsed.length > 0 ? parsed : "default";
  } catch {
    return "default";
  }
}

/**
 * Theme-contributed template — schema lives in the database as JSON Schema
 * (themes ship Zod, the frontend converts via z.toJSONSchema before
 * registering). Validated server-side with ajv.
 */
export interface ContributedTemplate {
  themeId: string;
  kind: string;
  label: string;
  description: string | null;
  jsonSchema: Record<string, unknown>;
}

// Process-wide ajv instance; compiled validators are memoized per kind so
// repeated saves of the same template kind don't pay the compile cost twice.
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const compiledCache = new Map<string, ValidateFunction>();

function cacheKey(themeId: string, kind: string): string {
  return `${themeId}::${kind}`;
}

export function clearCompiledCache(): void {
  compiledCache.clear();
}

/**
 * Looks up a contributed template by kind, scoped to a specific theme. PR C2's
 * upper layers pass the currently-active themeId so deactivated themes'
 * templates are not considered.
 */
export async function getContributedTemplate(
  themeId: string,
  kind: string,
): Promise<ContributedTemplate | null> {
  const [row] = await db
    .select()
    .from(templateSchemas)
    .where(and(eq(templateSchemas.themeId, themeId), eq(templateSchemas.kind, kind)))
    .limit(1);
  if (!row) return null;
  return {
    themeId: row.themeId,
    kind: row.kind,
    label: row.label,
    description: row.description,
    jsonSchema: row.jsonSchema as Record<string, unknown>,
  };
}

export async function listContributedTemplates(themeId: string): Promise<ContributedTemplate[]> {
  const rows = await db
    .select()
    .from(templateSchemas)
    .where(eq(templateSchemas.themeId, themeId));
  return rows.map((row) => ({
    themeId: row.themeId,
    kind: row.kind,
    label: row.label,
    description: row.description,
    jsonSchema: row.jsonSchema as Record<string, unknown>,
  }));
}

export function validateAgainstContributed(
  template: ContributedTemplate,
  data: unknown,
):
  | { ok: true; data: unknown }
  | { ok: false; error: string; details: unknown } {
  const key = cacheKey(template.themeId, template.kind);
  let validate = compiledCache.get(key);
  if (!validate) {
    try {
      validate = ajv.compile(template.jsonSchema);
    } catch (e) {
      return {
        ok: false,
        error: `Template schema for "${template.kind}" failed to compile`,
        details: (e as Error).message,
      };
    }
    compiledCache.set(key, validate);
  }
  const candidate = data ?? {};
  if (validate(candidate)) {
    return { ok: true, data: candidate };
  }
  return {
    ok: false,
    error: "Structured data validation failed",
    details: validate.errors,
  };
}
