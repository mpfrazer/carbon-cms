import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { readThemeConfig } from "@/lib/theme-compiler";
import type { ThemeVariableDefinition } from "@/lib/theme-compiler";
import { getThemeVarValues, setThemeVarValues, resolveThemeVars } from "@/lib/theme-vars";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ slug: string }> };

async function resolveSlug(slug: string): Promise<string> {
  if (slug !== "active") return slug;
  const row = await db.select().from(settings).where(eq(settings.key, "activeTheme")).limit(1);
  return row[0] ? JSON.parse(row[0].value) : "default";
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const slug = await resolveSlug((await params).slug);
    const config = await readThemeConfig(slug);
    const variables = (config.variables as ThemeVariableDefinition[] | undefined) ?? [];
    const stored = await getThemeVarValues(slug);
    const values = resolveThemeVars(variables, stored);
    return ok({ slug, variables, values });
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const slug = await resolveSlug((await params).slug);
    const config = await readThemeConfig(slug);
    const variables = (config.variables as ThemeVariableDefinition[] | undefined) ?? [];
    const validKeys = new Set(variables.map((v) => v.key));

    const body = await req.json();
    if (typeof body !== "object" || body === null) return badRequest("Body must be a JSON object");

    const filtered = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).filter(([k]) => validKeys.has(k)),
    );

    await setThemeVarValues(slug, filtered);
    return ok({ slug, values: filtered });
  } catch (e) {
    return serverError(e);
  }
}
