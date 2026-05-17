"use client";

import { listTemplates } from "@/templates";

interface AdditionalTemplate {
  kind: string;
  label: string;
  description: string | null;
  source: "theme";
  themeId?: string;
}

interface Props {
  value: string;
  onChange: (kind: string) => void;
  /**
   * Theme-contributed templates fetched at runtime via /api/v1/templates.
   * Merged with the local built-in registry; built-ins win on kind conflict.
   */
  additionalTemplates?: AdditionalTemplate[];
  /**
   * If true, switching template will be confirmed. Use this when the post
   * already has structuredData that may not validate against the new schema.
   */
  confirmOnChange?: boolean;
  disabled?: boolean;
}

export function TemplatePicker({ value, onChange, additionalTemplates = [], confirmOnChange, disabled }: Props) {
  const local = listTemplates();
  const localKinds = new Set(local.map((t) => t.kind));
  const contributed = additionalTemplates.filter((t) => !localKinds.has(t.kind));

  const options: { kind: string; label: string; description: string | null; source: "builtin" | "theme" }[] = [
    ...local.map((t) => ({ kind: t.kind, label: t.label, description: t.description ?? null, source: "builtin" as const })),
    ...contributed.map((t) => ({ kind: t.kind, label: t.label, description: t.description, source: "theme" as const })),
  ];

  const current = options.find((t) => t.kind === value);

  function handle(next: string) {
    if (next === value) return;
    if (confirmOnChange) {
      const ok = confirm(
        "Changing the template will clear any structured fields entered for the previous template. Continue?",
      );
      if (!ok) return;
    }
    onChange(next);
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Template</label>
      <select
        value={value}
        onChange={(e) => handle(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
      >
        {options.map((t) => (
          <option key={t.kind} value={t.kind}>
            {t.label}{t.source === "theme" ? " (from active theme)" : ""}
          </option>
        ))}
      </select>
      {current?.description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{current.description}</p>
      )}
    </div>
  );
}
