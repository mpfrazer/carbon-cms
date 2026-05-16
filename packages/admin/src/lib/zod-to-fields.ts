import { z } from "zod";

/**
 * Field descriptors produced by walking a JSON Schema. The auto-form
 * renderer consumes these to produce form controls. Pure-data
 * representation so the introspection logic is testable in isolation.
 */
export type FieldDescriptor =
  | StringField
  | NumberField
  | BooleanField
  | EnumField
  | ArrayField
  | ObjectField
  | UnknownField;

interface BaseField {
  key: string;
  label: string;
  description?: string;
  required: boolean;
}

export interface StringField extends BaseField {
  kind: "string";
  format?: "email" | "url" | "uri";
  minLength?: number;
  maxLength?: number;
}

export interface NumberField extends BaseField {
  kind: "number";
  integer: boolean;
  minimum?: number;
  maximum?: number;
}

export interface BooleanField extends BaseField {
  kind: "boolean";
}

export interface EnumField extends BaseField {
  kind: "enum";
  options: string[];
}

export interface ArrayField extends BaseField {
  kind: "array";
  itemKind: "string" | "number";
  itemFormat?: "email" | "url" | "uri";
  minItems?: number;
  maxItems?: number;
}

export interface ObjectField extends BaseField {
  kind: "object";
  fields: FieldDescriptor[];
}

export interface UnknownField extends BaseField {
  kind: "unknown";
  reason: string;
}

/** camelCase / snake_case / kebab-case → Title Case for human-readable form labels. */
export function deriveLabel(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
}

interface JsonSchemaNode {
  type?: string | string[];
  format?: string;
  enum?: unknown[];
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
}

function descriptorFor(
  key: string,
  node: JsonSchemaNode,
  required: boolean,
): FieldDescriptor {
  const label = deriveLabel(key);
  const description = typeof node.description === "string" ? node.description : undefined;
  const base = { key, label, description, required };

  // Enum is identified by the `enum` array regardless of underlying type.
  if (Array.isArray(node.enum) && node.enum.length > 0) {
    return {
      ...base,
      kind: "enum",
      options: node.enum.filter((v): v is string => typeof v === "string"),
    };
  }

  // type may be array (e.g. ["string", "null"] for nullable). Treat null as
  // additive — the field is not required when null is admissible.
  const typeArray = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
  const types = typeArray.filter((t) => t !== "null");
  const nullable = typeArray.includes("null");
  const effectiveRequired = required && !nullable;

  if (types.length === 0) {
    return { ...base, kind: "unknown", reason: "no type" };
  }

  if (types.length > 1) {
    return { ...base, kind: "unknown", reason: `union types not supported: ${types.join(", ")}` };
  }

  const type = types[0];

  switch (type) {
    case "string":
      return {
        ...base,
        required: effectiveRequired,
        kind: "string",
        ...(node.format === "email" && { format: "email" }),
        ...(node.format === "url" && { format: "url" }),
        ...(node.format === "uri" && { format: "uri" }),
        ...(typeof node.minLength === "number" && { minLength: node.minLength }),
        ...(typeof node.maxLength === "number" && { maxLength: node.maxLength }),
      };
    case "number":
    case "integer":
      return {
        ...base,
        required: effectiveRequired,
        kind: "number",
        integer: type === "integer",
        ...(typeof node.minimum === "number" && { minimum: node.minimum }),
        ...(typeof node.maximum === "number" && { maximum: node.maximum }),
      };
    case "boolean":
      return { ...base, required: effectiveRequired, kind: "boolean" };
    case "array": {
      const item = node.items;
      if (!item || !item.type) {
        return { ...base, kind: "unknown", reason: "array with no item type" };
      }
      const itemType = Array.isArray(item.type) ? item.type[0] : item.type;
      if (itemType !== "string" && itemType !== "number" && itemType !== "integer") {
        return { ...base, kind: "unknown", reason: `array of ${itemType} not supported` };
      }
      const itemFormat = item.format === "email" || item.format === "url" || item.format === "uri"
        ? item.format
        : undefined;
      return {
        ...base,
        required: effectiveRequired,
        kind: "array",
        itemKind: itemType === "integer" ? "number" : itemType,
        ...(itemFormat && { itemFormat }),
        ...(typeof node.minItems === "number" && { minItems: node.minItems }),
        ...(typeof node.maxItems === "number" && { maxItems: node.maxItems }),
      };
    }
    case "object": {
      if (!node.properties) {
        return { ...base, kind: "object", required: effectiveRequired, fields: [] };
      }
      const requiredKeys = new Set(node.required ?? []);
      const fields = Object.entries(node.properties).map(([k, child]) =>
        descriptorFor(k, child as JsonSchemaNode, requiredKeys.has(k)),
      );
      return { ...base, required: effectiveRequired, kind: "object", fields };
    }
    default:
      return { ...base, kind: "unknown", reason: `unsupported type "${type}"` };
  }
}

/**
 * Convert a Zod object schema into an array of field descriptors. Goes via
 * `z.toJSONSchema` so the introspection works against a stable, well-defined
 * shape rather than Zod's internal types.
 */
export function fieldsFromSchema(schema: z.ZodObject<z.ZodRawShape>): FieldDescriptor[] {
  const json = z.toJSONSchema(schema) as JsonSchemaNode;
  if (!json.properties) return [];
  const requiredKeys = new Set(json.required ?? []);
  return Object.entries(json.properties).map(([key, node]) =>
    descriptorFor(key, node as JsonSchemaNode, requiredKeys.has(key)),
  );
}
