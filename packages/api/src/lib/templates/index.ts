import { registerTemplate, getTemplate, validateStructuredDataBuiltinOnly } from "./registry";
import { article } from "./article";
import { recipe } from "./recipe";
import {
  getActiveThemeId,
  getContributedTemplate,
  validateAgainstContributed,
} from "./contributed";

// Built-in templates. Theme-contributed templates register at activation
// time via POST /api/v1/templates/register and live in the
// template_schemas table.
registerTemplate(article);
registerTemplate(recipe);

/**
 * Validates a structured-data payload against the named template's schema.
 * Considers both built-in templates and theme-contributed templates registered
 * by the currently-active theme. Built-ins take precedence when a kind exists
 * in both (per the architecture doc's conflict resolution).
 */
export async function validateStructuredData(
  kind: string,
  data: unknown,
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 422; error: string; details?: unknown }
> {
  // Built-in takes precedence — never touches the DB
  if (getTemplate(kind)) {
    return validateStructuredDataBuiltinOnly(kind, data);
  }

  // Theme-contributed — scoped to the currently-active theme. If the DB is
  // unreachable, treat as "no contributed match" so built-in writes are not
  // blocked by infra issues affecting only the contributed-template path.
  let contributed = null;
  try {
    const activeTheme = await getActiveThemeId();
    contributed = await getContributedTemplate(activeTheme, kind);
  } catch (e) {
    console.error("[templates] contributed lookup failed:", e);
  }

  if (!contributed) {
    return { ok: false, status: 400, error: `Unknown template "${kind}"` };
  }
  const result = validateAgainstContributed(contributed, data);
  if (!result.ok) {
    return {
      ok: false,
      status: 422,
      error: result.error,
      details: result.details,
    };
  }
  return { ok: true, data: result.data };
}

export { article, recipe };
export {
  registerTemplate,
  getTemplate,
  listTemplates,
  listTemplateKinds,
  validateStructuredDataBuiltinOnly,
  type ApiTemplate,
} from "./registry";
export {
  getActiveThemeId,
  getContributedTemplate,
  listContributedTemplates,
  validateAgainstContributed,
  clearCompiledCache,
  type ContributedTemplate,
} from "./contributed";
