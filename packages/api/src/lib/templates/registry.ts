import { z } from "zod";

/**
 * The API-side view of a post template. The frontend and admin packages
 * extend this contract with Render and AdminEditor components respectively;
 * the API only ever needs the kind, label, and validation schema.
 */
export interface ApiTemplate {
  /** Persistent identifier. Stored on every post that uses this template. */
  kind: string;
  /** Admin-facing label for picker UIs. */
  label: string;
  /** Optional one-line description of when to use this template. */
  description?: string;
  /** Zod schema for the structuredData payload. Always an object schema. */
  schema: z.ZodObject<z.ZodRawShape>;
}

const registry = new Map<string, ApiTemplate>();

export function registerTemplate(template: ApiTemplate): void {
  registry.set(template.kind, template);
}

export function getTemplate(kind: string): ApiTemplate | undefined {
  return registry.get(kind);
}

export function listTemplates(): ApiTemplate[] {
  return Array.from(registry.values());
}

export function listTemplateKinds(): string[] {
  return Array.from(registry.keys());
}

/**
 * Validates a structured-data payload against the named template's schema.
 * Returns the parsed (and possibly stripped/normalized) data on success,
 * or a structured error result on failure.
 */
export function validateStructuredData(
  kind: string,
  data: unknown,
):
  | { ok: true; data: unknown }
  | { ok: false; status: 400 | 422; error: string; details?: unknown } {
  const template = getTemplate(kind);
  if (!template) {
    return { ok: false, status: 400, error: `Unknown template "${kind}"` };
  }
  const parsed = template.schema.safeParse(data ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "Structured data validation failed",
      details: parsed.error.flatten(),
    };
  }
  return { ok: true, data: parsed.data };
}
