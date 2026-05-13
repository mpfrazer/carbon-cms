import type { ComponentType } from "react";
import type { z } from "zod";

/**
 * The admin-side view of a post template. Holds the validation schema (for
 * auto-form generation and client-side feedback) and an optional custom
 * AdminEditor component for templates whose UX needs more than the
 * generic auto-form can provide.
 *
 * Kept in sync with the API's ApiTemplate registry by drift-check tests.
 */
export interface AdminTemplate {
  /** Persistent identifier; matches ApiTemplate.kind. */
  kind: string;
  /** Picker label. */
  label: string;
  /** One-line description shown under the picker. */
  description?: string;
  /** Zod schema for structuredData. Drives the auto-generated form. Always an object schema. */
  schema: z.ZodObject<z.ZodRawShape>;
  /**
   * Optional custom editor. If provided, supersedes the auto-generated form.
   * Receives the current value and an onChange callback.
   */
  AdminEditor?: ComponentType<AdminEditorProps>;
}

export interface AdminEditorProps {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

const registry = new Map<string, AdminTemplate>();

export function registerTemplate(template: AdminTemplate): void {
  registry.set(template.kind, template);
}

export function getTemplate(kind: string): AdminTemplate | undefined {
  return registry.get(kind);
}

export function listTemplates(): AdminTemplate[] {
  return Array.from(registry.values());
}
