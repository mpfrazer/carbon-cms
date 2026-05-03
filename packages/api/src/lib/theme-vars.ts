import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ThemeVariableDefinition } from "@/lib/theme-compiler";

export async function getThemeVarValues(slug: string): Promise<Record<string, unknown>> {
  const key = `themeVars.${slug}`;
  const row = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (!row[0]) return {};
  try {
    return JSON.parse(row[0].value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function setThemeVarValues(slug: string, vars: Record<string, unknown>): Promise<void> {
  const key = `themeVars.${slug}`;
  const now = new Date();
  await db
    .insert(settings)
    .values({ key, value: JSON.stringify(vars), updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: sql`excluded.value`, updatedAt: now } });
}

export function resolveThemeVars(
  variables: ThemeVariableDefinition[],
  stored: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    variables.map((v) => [v.key, v.key in stored ? stored[v.key] : v.default]),
  );
}
