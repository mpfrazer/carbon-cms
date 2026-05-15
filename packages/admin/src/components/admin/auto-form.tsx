"use client";

import { Plus, Trash2 } from "lucide-react";
import type { z } from "zod";
import {
  fieldsFromSchema,
  type FieldDescriptor,
  type ArrayField,
  type ObjectField,
} from "@/lib/zod-to-fields";

interface AutoFormProps {
  schema: z.ZodObject<z.ZodRawShape>;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

/**
 * Generates a form from a Zod object schema. Handles primitives, enums,
 * arrays of primitives, and nested objects. Templates that need richer UX
 * (per-step images, drag-and-drop reorder, custom widgets) should ship a
 * custom AdminEditor instead — see RecipeEditor for an example.
 */
export function AutoForm({ schema, value, onChange }: AutoFormProps) {
  const fields = fieldsFromSchema(schema);
  if (fields.length === 0) return null;
  return (
    <div className="space-y-3 rounded-md border border-neutral-200 dark:border-neutral-700 p-4">
      {fields.map((f) => (
        <FieldControl
          key={f.key}
          field={f}
          value={value[f.key]}
          onChange={(next) => onChange({ ...value, [f.key]: next })}
        />
      ))}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

interface FieldControlProps {
  field: FieldDescriptor;
  value: unknown;
  onChange: (next: unknown) => void;
}

function FieldLabel({ field }: { field: FieldDescriptor }) {
  return (
    <div className="space-y-0.5">
      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {field.label}
        {!field.required && <span className="ml-1 text-neutral-400">(optional)</span>}
      </label>
      {field.description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{field.description}</p>
      )}
    </div>
  );
}

function FieldControl({ field, value, onChange }: FieldControlProps) {
  switch (field.kind) {
    case "string":
      return (
        <div className="space-y-1">
          <FieldLabel field={field} />
          <input
            type={field.format === "email" ? "email" : field.format === "url" || field.format === "uri" ? "url" : "text"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            minLength={field.minLength}
            maxLength={field.maxLength}
            required={field.required}
            className={inputClass}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-1">
          <FieldLabel field={field} />
          <input
            type="number"
            step={field.integer ? 1 : "any"}
            min={field.minimum}
            max={field.maximum}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return onChange(undefined);
              const n = field.integer ? parseInt(v, 10) : parseFloat(v);
              onChange(Number.isNaN(n) ? undefined : n);
            }}
            required={field.required}
            className={inputClass}
          />
        </div>
      );

    case "boolean":
      return (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {field.label}
            {field.description && (
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">{field.description}</span>
            )}
          </span>
        </label>
      );

    case "enum":
      return (
        <div className="space-y-1">
          <FieldLabel field={field} />
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            required={field.required}
            className={inputClass}
          >
            {!field.required && <option value="">—</option>}
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case "array":
      return <ArrayControl field={field} value={value} onChange={onChange} />;

    case "object":
      return <ObjectControl field={field} value={value} onChange={onChange} />;

    case "unknown":
      return (
        <div className="space-y-1">
          <FieldLabel field={field} />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Auto-form does not support this field type ({field.reason}). Edit raw JSON below.
          </p>
          <textarea
            className={inputClass + " font-mono"}
            rows={3}
            value={JSON.stringify(value ?? null, null, 2)}
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
}

function ArrayControl({ field, value, onChange }: { field: ArrayField; value: unknown; onChange: (next: unknown) => void }) {
  const items: (string | number)[] = Array.isArray(value)
    ? (value.filter((v) => typeof v === "string" || typeof v === "number") as (string | number)[])
    : [];

  function setItem(i: number, next: string | number | undefined) {
    const copy = [...items];
    if (next === undefined) copy.splice(i, 1);
    else copy[i] = next;
    onChange(copy);
  }

  function add() {
    const next = field.itemKind === "number" ? 0 : "";
    onChange([...items, next]);
  }

  // Always render at least one input row so the user has something to edit
  // when starting from an empty value. Required arrays will fail server-side
  // validation if left empty, which the form's error surface reports.
  const rows = items.length > 0 ? items : ([field.itemKind === "number" ? "" : ""] as (string | number | "")[]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <FieldLabel field={field} />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {rows.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type={
                field.itemKind === "number"
                  ? "number"
                  : field.itemFormat === "email"
                  ? "email"
                  : field.itemFormat === "url" || field.itemFormat === "uri"
                  ? "url"
                  : "text"
              }
              value={item === "" ? "" : item}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  // Empty in the only-empty placeholder row means do nothing.
                  if (items.length === 0) return;
                  setItem(i, "");
                  return;
                }
                if (field.itemKind === "number") {
                  const n = parseFloat(v);
                  if (!Number.isNaN(n)) setItem(i, n);
                } else {
                  setItem(i, v);
                }
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setItem(i, undefined)}
              disabled={items.length === 0}
              className="rounded p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectControl({ field, value, onChange }: { field: ObjectField; value: unknown; onChange: (next: unknown) => void }) {
  const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return (
    <div className="space-y-2">
      <FieldLabel field={field} />
      <div className="space-y-3 pl-3 border-l-2 border-neutral-200 dark:border-neutral-700">
        {field.fields.map((child) => (
          <FieldControl
            key={child.key}
            field={child}
            value={obj[child.key]}
            onChange={(next) => onChange({ ...obj, [child.key]: next })}
          />
        ))}
      </div>
    </div>
  );
}
