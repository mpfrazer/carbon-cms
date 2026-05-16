import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { listTemplates, listContributedTemplates, getActiveThemeId } from "@/lib/templates";

/**
 * Returns the list of templates available to the post editor — built-ins
 * plus templates contributed by the currently-active theme. The admin's
 * post-form uses this to populate its template picker for theme-contributed
 * kinds (built-ins are also bundled into the admin's local registry).
 */
export async function GET(_req: NextRequest) {
  try {
    const builtins = listTemplates().map((t) => ({
      kind: t.kind,
      label: t.label,
      description: t.description ?? null,
      source: "builtin" as const,
    }));

    const activeTheme = await getActiveThemeId();
    const contributed = (await listContributedTemplates(activeTheme)).map((t) => ({
      kind: t.kind,
      label: t.label,
      description: t.description,
      jsonSchema: t.jsonSchema,
      source: "theme" as const,
      themeId: t.themeId,
    }));

    // Built-ins win on kind conflict (per architecture doc resolution rule).
    const builtinKinds = new Set(builtins.map((t) => t.kind));
    const filtered = contributed.filter((t) => !builtinKinds.has(t.kind));

    return ok([...builtins, ...filtered]);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST() {
  // Method-not-allowed on the collection root; registration lives at
  // /templates/register and /templates/unregister so the action is explicit
  // in the URL and CORS / observability are easy to scope.
  return NextResponse.json({ error: "Use /api/v1/templates/register or /unregister" }, { status: 405 });
}
