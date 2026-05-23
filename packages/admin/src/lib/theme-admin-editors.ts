import type { ComponentType } from "react";
import type { AdminEditorProps } from "@/templates/registry";

type EditorMap = Record<string, ComponentType<AdminEditorProps>>;

// Themes whose admin folder ships a custom-editor module. Listed
// explicitly so the dynamic import below doesn't error for themes
// that have no admin-side editors. Kept in sync with the on-disk
// admin/src/themes/<slug>/admin-editors.ts files.
const THEMES_WITH_ADMIN_EDITORS = new Set(["library"]);

// Process-wide cache; the import is async but we resolve once per theme
// for the lifetime of the admin process.
const cache = new Map<string, Promise<EditorMap>>();

/**
 * Returns the map of admin-side editor components contributed by the named
 * theme. Empty object if the theme contributes none, or if the import
 * fails. Templates that don't have a matching entry fall back to the
 * JsonSchemaAutoForm path.
 *
 * In decoupled mode the admin service must ship the theme's admin code as
 * part of its own bundle — same dual-directory pattern as theme.config.json.
 * Custom (non-built-in) themes that want admin editors are deferred until
 * a follow-up phase adds a packaging mechanism for them.
 */
export function getThemeAdminEditors(themeId: string): Promise<EditorMap> {
  if (!THEMES_WITH_ADMIN_EDITORS.has(themeId)) return Promise.resolve({});
  const hit = cache.get(themeId);
  if (hit) return hit;
  const promise = (async () => {
    try {
      const mod = (await import(`../themes/${themeId}/admin-editors`)) as { adminEditors?: EditorMap };
      return mod.adminEditors ?? {};
    } catch (e) {
      console.warn(`[admin] failed to load admin editors for theme "${themeId}":`, e);
      return {};
    }
  })();
  cache.set(themeId, promise);
  return promise;
}

/** Test-only. Reset between tests that need a fresh cache. */
export function clearThemeAdminEditorsCache(): void {
  cache.clear();
}
