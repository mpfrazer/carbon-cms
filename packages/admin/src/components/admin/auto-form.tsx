"use client";

import type { z } from "zod";

interface AutoFormProps {
  schema: z.ZodObject<z.ZodRawShape>;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

/**
 * Generates a form from a Zod object schema. For PR A the only built-in
 * template (article) has an empty schema, so this component renders
 * nothing in practice — the substrate is in place but the introspection
 * walk lives in PR C, where book-review will be the first template to
 * actually exercise it.
 *
 * Templates that need a richer editing experience than auto-form can
 * provide should ship a custom AdminEditor instead.
 */
export function AutoForm({ schema, value, onChange }: AutoFormProps) {
  const fields = Object.keys(schema.shape);

  if (fields.length === 0) return null;

  // Defensive fallback for templates with non-empty schemas before the
  // real introspection ships. Should not be reached by anything in
  // PR A's built-in set.
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
      This template has structured fields ({fields.join(", ")}) but no custom AdminEditor and the auto-form generator is not yet implemented for non-empty schemas. Edit raw JSON below.
      <textarea
        className="mt-2 w-full rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-neutral-800 px-2 py-1.5 font-mono text-xs"
        rows={6}
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            // ignore parse errors mid-typing
          }
        }}
      />
    </div>
  );
}
