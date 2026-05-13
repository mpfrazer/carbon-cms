"use client";

import { listTemplates } from "@/templates";

interface Props {
  value: string;
  onChange: (kind: string) => void;
  /**
   * If true, switching template will be confirmed. Use this when the post
   * already has structuredData that may not validate against the new schema.
   */
  confirmOnChange?: boolean;
  disabled?: boolean;
}

export function TemplatePicker({ value, onChange, confirmOnChange, disabled }: Props) {
  const templates = listTemplates();
  const current = templates.find((t) => t.kind === value);

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
        {templates.map((t) => (
          <option key={t.kind} value={t.kind}>{t.label}</option>
        ))}
      </select>
      {current?.description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{current.description}</p>
      )}
    </div>
  );
}
