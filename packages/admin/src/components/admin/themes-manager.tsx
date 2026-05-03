"use client";

import { useEffect, useState } from "react";
import { Palette, Check, Loader2, ImageIcon, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";

// Minimal font registry for the admin UI — keep in sync with packages/frontend/src/lib/fonts.ts
const ADMIN_FONTS = [
  // System
  { name: "system", label: "System sans-serif", category: "System", stack: "system-ui, -apple-system, sans-serif", googleFamily: null, contexts: ["body", "heading"] },
  { name: "system-serif", label: "System serif", category: "System", stack: "Georgia, 'Times New Roman', serif", googleFamily: null, contexts: ["body", "heading"] },
  { name: "system-mono", label: "System monospace", category: "System", stack: "'Courier New', Courier, monospace", googleFamily: null, contexts: ["body"] },
  // Sans-serif
  { name: "inter", label: "Inter", category: "Sans-serif", stack: "'Inter', system-ui, sans-serif", googleFamily: "Inter", contexts: ["body", "heading"] },
  { name: "plus-jakarta-sans", label: "Plus Jakarta Sans", category: "Sans-serif", stack: "'Plus Jakarta Sans', system-ui, sans-serif", googleFamily: "Plus Jakarta Sans", contexts: ["body", "heading"] },
  { name: "dm-sans", label: "DM Sans", category: "Sans-serif", stack: "'DM Sans', system-ui, sans-serif", googleFamily: "DM Sans", contexts: ["body", "heading"] },
  { name: "lato", label: "Lato", category: "Sans-serif", stack: "'Lato', system-ui, sans-serif", googleFamily: "Lato", contexts: ["body", "heading"] },
  { name: "open-sans", label: "Open Sans", category: "Sans-serif", stack: "'Open Sans', system-ui, sans-serif", googleFamily: "Open Sans", contexts: ["body", "heading"] },
  { name: "nunito", label: "Nunito", category: "Sans-serif", stack: "'Nunito', system-ui, sans-serif", googleFamily: "Nunito", contexts: ["body", "heading"] },
  // Serif
  { name: "source-serif-4", label: "Source Serif 4", category: "Serif", stack: "'Source Serif 4', Georgia, serif", googleFamily: "Source Serif 4", contexts: ["body", "heading"] },
  { name: "merriweather", label: "Merriweather", category: "Serif", stack: "'Merriweather', Georgia, serif", googleFamily: "Merriweather", contexts: ["body", "heading"] },
  { name: "lora", label: "Lora", category: "Serif", stack: "'Lora', Georgia, serif", googleFamily: "Lora", contexts: ["body", "heading"] },
  { name: "libre-baskerville", label: "Libre Baskerville", category: "Serif", stack: "'Libre Baskerville', Georgia, serif", googleFamily: "Libre Baskerville", contexts: ["body", "heading"] },
  // Display serif
  { name: "playfair-display", label: "Playfair Display", category: "Display serif", stack: "'Playfair Display', Georgia, serif", googleFamily: "Playfair Display", contexts: ["heading"] },
  { name: "dm-serif-display", label: "DM Serif Display", category: "Display serif", stack: "'DM Serif Display', Georgia, serif", googleFamily: "DM Serif Display", contexts: ["heading"] },
  { name: "fraunces", label: "Fraunces", category: "Display serif", stack: "'Fraunces', Georgia, serif", googleFamily: "Fraunces", contexts: ["heading"] },
  // Geometric
  { name: "space-grotesk", label: "Space Grotesk", category: "Geometric", stack: "'Space Grotesk', system-ui, sans-serif", googleFamily: "Space Grotesk", contexts: ["body", "heading"] },
  { name: "sora", label: "Sora", category: "Geometric", stack: "'Sora', system-ui, sans-serif", googleFamily: "Sora", contexts: ["body", "heading"] },
  { name: "raleway", label: "Raleway", category: "Geometric", stack: "'Raleway', system-ui, sans-serif", googleFamily: "Raleway", contexts: ["body", "heading"] },
  // Monospace
  { name: "jetbrains-mono", label: "JetBrains Mono", category: "Monospace", stack: "'JetBrains Mono', 'Courier New', monospace", googleFamily: "JetBrains Mono", contexts: ["body"] },
  { name: "ibm-plex-mono", label: "IBM Plex Mono", category: "Monospace", stack: "'IBM Plex Mono', 'Courier New', monospace", googleFamily: "IBM Plex Mono", contexts: ["body"] },
] as const;

type AdminFont = typeof ADMIN_FONTS[number];

const HEADING_WEIGHTS = [
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "600", label: "Semibold (600)" },
  { value: "700", label: "Bold (700)" },
];

function groupByCategory(fonts: readonly AdminFont[]) {
  const map = new Map<string, AdminFont[]>();
  for (const f of fonts) {
    if (!map.has(f.category)) map.set(f.category, []);
    map.get(f.category)!.push(f);
  }
  return map;
}

function buildAdminGoogleFontsUrl(fontNames: string[]): string | null {
  const families = fontNames
    .map((name) => ADMIN_FONTS.find((f) => f.name === name))
    .filter((f): f is AdminFont => !!f && f.googleFamily !== null)
    .map((f) => `family=${encodeURIComponent(f.googleFamily!)}:wght@400;500;600;700`);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

function getStack(name: string): string {
  return ADMIN_FONTS.find((f) => f.name === name)?.stack ?? "system-ui, sans-serif";
}

function FontSelect({ value, onChange, filter, label }: { value: string; onChange: (v: string) => void; filter: "body" | "heading"; label: string }) {
  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  const filtered = ADMIN_FONTS.filter((f) => (f.contexts as readonly string[]).includes(filter));
  const grouped = groupByCategory(filtered);
  const previewStack = getStack(value);
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {Array.from(grouped.entries()).map(([cat, fonts]) => (
          <optgroup key={cat} label={cat}>
            {fonts.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
          </optgroup>
        ))}
      </select>
      <p className="mt-2 text-base text-neutral-500 truncate" style={{ fontFamily: previewStack }}>
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
}

interface ThemeCapabilities {
  blog: boolean;
  search: { header: boolean; page: boolean };
  pageBuilder: boolean;
  comments: boolean;
}

interface ThemeOverrides {
  searchMode?: "none" | "header" | "page";
  searchInputMode?: "submit" | "instant";
  showBlogLink?: boolean;
  postsPerPage?: number;
}

interface ThemeVariableDefinition {
  key: string;
  label: string;
  type: "color" | "string" | "number" | "select";
  default: string | number;
  options?: string[];
}

interface Theme {
  slug: string;
  name: string;
  active: boolean;
  builtin: boolean;
  compiled?: boolean | null;
  compiledAt?: string | null;
  version?: string;
  author?: string;
  description?: string;
  capabilities?: ThemeCapabilities;
  overrides?: ThemeOverrides;
  variables?: ThemeVariableDefinition[];
}

interface AppearanceState {
  themeAccentColor: string;
  themeFontBody: string;
  themeFontHeading: string;
  themeHeadingWeight: string;
  themeLogoUrl: string;
  themeFooterText: string;
  customCssVars: { key: string; value: string }[];
}

function LogoPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-40 rounded border border-neutral-200 bg-neutral-50 overflow-hidden">
            <img src={value} alt="Logo" className="h-full w-full object-contain p-1" />
          </div>
          <button type="button" onClick={() => onChange("")} className="text-xs text-neutral-500 hover:text-red-600 transition-colors">Remove</button>
          <button type="button" onClick={() => setOpen(true)} className="text-xs text-neutral-500 hover:text-neutral-800 underline underline-offset-2 transition-colors">Change</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors">
            <ImageIcon className="h-4 w-4" /> Choose logo image
          </button>
          <span className="text-xs text-neutral-400">or leave blank to show site title</span>
        </div>
      )}
      <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste an image URL…" className={inputClass} />
      <MediaPickerModal title="Choose logo" open={open} onClose={() => setOpen(false)} onSelect={(item) => onChange(item.url)} />
    </div>
  );
}

const defaultCapabilities: ThemeCapabilities = {
  blog: true,
  search: { header: true, page: true },
  pageBuilder: true,
  comments: true,
};

function ThemeVarsEditor({ theme, onSchemaSaved }: { theme: Theme; onSchemaSaved: (vars: ThemeVariableDefinition[]) => void }) {
  const [defs, setDefs] = useState<ThemeVariableDefinition[]>(theme.variables ?? []);
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [loadingVars, setLoadingVars] = useState(true);
  const [savingVars, setSavingVars] = useState(false);
  const [savingSchema, setSavingSchema] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newDef, setNewDef] = useState<Partial<ThemeVariableDefinition> & { optionsRaw?: string }>({});
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/themes/${theme.slug}/vars`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setDefs(json.data.variables ?? []);
          setValues(json.data.values ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setLoadingVars(false));
  }, [theme.slug]);

  async function saveValues() {
    setSavingVars(true);
    setMessage(null);
    const res = await fetch(`/api/v1/themes/${theme.slug}/vars`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSavingVars(false);
    setMessage(res.ok ? "Values saved." : "Failed to save values.");
  }

  async function saveSchema(updated: ThemeVariableDefinition[]) {
    setSavingSchema(true);
    setMessage(null);
    const res = await fetch(`/api/v1/themes/${theme.slug}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: updated }),
    });
    setSavingSchema(false);
    if (res.ok) {
      setDefs(updated);
      onSchemaSaved(updated);
      setMessage("Schema saved.");
    } else {
      const json = await res.json().catch(() => ({}));
      setMessage(json.error ?? "Failed to save schema.");
    }
  }

  function removeDef(key: string) {
    const updated = defs.filter((d) => d.key !== key);
    saveSchema(updated);
    setValues((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function addDef() {
    if (!newDef.key || !newDef.label || !newDef.type) return;
    const options = newDef.type === "select" && newDef.optionsRaw
      ? newDef.optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const def: ThemeVariableDefinition = {
      key: newDef.key,
      label: newDef.label,
      type: newDef.type,
      default: newDef.default ?? (newDef.type === "number" ? 0 : ""),
      ...(options ? { options } : {}),
    };
    const updated = [...defs, def];
    saveSchema(updated);
    setNewDef({});
    setShowAdd(false);
  }

  const inputCls = "w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";

  if (loadingVars) {
    return <p className="text-xs text-neutral-400 py-2">Loading variables…</p>;
  }

  return (
    <div className="space-y-4">
      {!theme.builtin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Variable Schema</p>
            <button type="button" onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded px-2 py-1 transition-colors">
              <Plus className="h-3 w-3" /> Add variable
            </button>
          </div>

          {defs.length === 0 && !showAdd && (
            <p className="text-xs text-neutral-400">No variables defined. Add one to make this theme customizable.</p>
          )}

          {defs.map((d) => (
            <div key={d.key} className="flex items-center gap-2 text-xs bg-white border border-neutral-200 rounded-md px-3 py-2">
              <code className="font-mono text-neutral-700 shrink-0">--{d.key}</code>
              <span className="text-neutral-500 truncate flex-1">{d.label}</span>
              <span className="text-neutral-400 shrink-0">{d.type}</span>
              {d.options && <span className="text-neutral-400 shrink-0 hidden sm:block">[{d.options.join(", ")}]</span>}
              <button type="button" onClick={() => removeDef(d.key)} disabled={savingSchema}
                className="text-neutral-400 hover:text-red-600 transition-colors shrink-0 disabled:opacity-50">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {showAdd && (
            <div className="rounded-md border border-neutral-200 bg-white p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Key (no --)</label>
                  <input value={newDef.key ?? ""} onChange={(e) => setNewDef({ ...newDef, key: e.target.value })}
                    placeholder="primaryColor" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Label</label>
                  <input value={newDef.label ?? ""} onChange={(e) => setNewDef({ ...newDef, label: e.target.value })}
                    placeholder="Primary Color" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Type</label>
                  <select value={newDef.type ?? ""} onChange={(e) => setNewDef({ ...newDef, type: e.target.value as ThemeVariableDefinition["type"] })}
                    className={inputCls}>
                    <option value="">— select —</option>
                    <option value="color">Color</option>
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Default</label>
                  <input value={String(newDef.default ?? "")} onChange={(e) => setNewDef({ ...newDef, default: newDef.type === "number" ? Number(e.target.value) : e.target.value })}
                    placeholder={newDef.type === "color" ? "#3b82f6" : newDef.type === "number" ? "0" : "value"}
                    className={inputCls} />
                </div>
                {newDef.type === "select" && (
                  <div className="col-span-2">
                    <label className="block text-xs text-neutral-500 mb-1">Options (comma-separated)</label>
                    <input value={newDef.optionsRaw ?? ""} onChange={(e) => setNewDef({ ...newDef, optionsRaw: e.target.value })}
                      placeholder="centered, wide, full" className={inputCls} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={addDef}
                  disabled={!newDef.key || !newDef.label || !newDef.type || savingSchema}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
                  {savingSchema ? "Saving…" : "Add"}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setNewDef({}); }}
                  className="text-xs text-neutral-500 hover:text-neutral-800">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {defs.length > 0 && (
        <div className="space-y-3">
          {!theme.builtin && <div className="border-t border-neutral-200 pt-3" />}
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Variable Values</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {defs.map((d) => (
              <div key={d.key} className="space-y-1">
                <label className="block text-xs font-medium text-neutral-600">{d.label}</label>
                {d.type === "color" && (
                  <div className="flex items-center gap-2">
                    <input type="color" value={String(values[d.key] ?? d.default)}
                      onChange={(e) => setValues({ ...values, [d.key]: e.target.value })}
                      className="h-8 w-12 cursor-pointer rounded border border-neutral-300 p-0.5" />
                    <input type="text" value={String(values[d.key] ?? d.default)}
                      onChange={(e) => setValues({ ...values, [d.key]: e.target.value })}
                      className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 font-mono text-xs focus:border-neutral-500 focus:outline-none" />
                  </div>
                )}
                {d.type === "string" && (
                  <input type="text" value={String(values[d.key] ?? d.default)}
                    onChange={(e) => setValues({ ...values, [d.key]: e.target.value })}
                    className={inputCls} />
                )}
                {d.type === "number" && (
                  <input type="number" value={String(values[d.key] ?? d.default)}
                    onChange={(e) => setValues({ ...values, [d.key]: parseFloat(e.target.value) || 0 })}
                    className={inputCls} />
                )}
                {d.type === "select" && d.options && (
                  <select value={String(values[d.key] ?? d.default)}
                    onChange={(e) => setValues({ ...values, [d.key]: e.target.value })}
                    className={inputCls}>
                    {d.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                <p className="text-xs text-neutral-400 font-mono">--{d.key}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={saveValues} disabled={savingVars}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {savingVars ? "Saving…" : "Save values"}
            </button>
            {message && (
              <span className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-700"}`}>{message}</span>
            )}
          </div>
        </div>
      )}

      {defs.length === 0 && theme.builtin && (
        <p className="text-xs text-neutral-400">This theme defines no variables.</p>
      )}
    </div>
  );
}

function ThemeConfigEditor({ theme, allThemeSlugs, onSaved }: { theme: Theme; allThemeSlugs: string[]; onSaved: (updated: Theme) => void }) {
  const [caps, setCaps] = useState<ThemeCapabilities>({ ...defaultCapabilities, ...theme.capabilities, search: { ...defaultCapabilities.search, ...theme.capabilities?.search } });
  const [overrides, setOverrides] = useState<ThemeOverrides>(theme.overrides ?? {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/v1/themes/${theme.slug}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capabilities: caps, overrides: Object.keys(overrides).length ? overrides : undefined }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setMessage("Saved.");
      onSaved({ ...theme, capabilities: caps, overrides });
    } else {
      setMessage(json.error ?? "Failed to save.");
    }
  }

  const checkboxClass = "h-4 w-4 rounded border-neutral-300";
  const labelClass = "text-sm text-neutral-700";

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Theme Capabilities</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className={checkboxClass} checked={caps.blog} onChange={(e) => setCaps({ ...caps, blog: e.target.checked })} />
          <span className={labelClass}>Blog (index + post templates)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className={checkboxClass} checked={caps.pageBuilder} onChange={(e) => setCaps({ ...caps, pageBuilder: e.target.checked })} />
          <span className={labelClass}>Page builder (block renderer)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className={checkboxClass} checked={caps.search.header} onChange={(e) => setCaps({ ...caps, search: { ...caps.search, header: e.target.checked } })} />
          <span className={labelClass}>Search — header bar</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className={checkboxClass} checked={caps.search.page} onChange={(e) => setCaps({ ...caps, search: { ...caps.search, page: e.target.checked } })} />
          <span className={labelClass}>Search — dedicated page</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className={checkboxClass} checked={caps.comments} onChange={(e) => setCaps({ ...caps, comments: e.target.checked })} />
          <span className={labelClass}>Comments section</span>
        </label>
      </div>

      <div className="border-t border-neutral-200 pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Setting Overrides <span className="font-normal normal-case text-neutral-400">(optional — takes precedence over admin settings)</span></p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Force search mode</label>
            <select value={overrides.searchMode ?? ""} onChange={(e) => setOverrides({ ...overrides, searchMode: e.target.value as ThemeOverrides["searchMode"] || undefined })}
              className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none">
              <option value="">No override</option>
              <option value="none">Disabled</option>
              <option value="header">Header bar</option>
              <option value="page">Search page</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Force posts per page</label>
            <input type="number" min={1} max={100} value={overrides.postsPerPage ?? ""}
              onChange={(e) => setOverrides({ ...overrides, postsPerPage: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="No override"
              className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <select value={overrides.showBlogLink === undefined ? "" : overrides.showBlogLink ? "true" : "false"}
              onChange={(e) => setOverrides({ ...overrides, showBlogLink: e.target.value === "" ? undefined : e.target.value === "true" })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none">
              <option value="">Blog link — no override</option>
              <option value="true">Blog link — always show</option>
              <option value="false">Blog link — always hide</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={save} disabled={saving || theme.builtin}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          title={theme.builtin ? "Built-in theme configs are read-only" : undefined}>
          {saving ? "Saving…" : "Save config"}
        </button>
        {theme.builtin && <span className="text-xs text-neutral-400">Built-in themes are read-only</span>}
        {message && (
          <span className={`text-sm ${message === "Saved." ? "text-green-700" : "text-red-600"}`}>{message}</span>
        )}
      </div>

      <div className="border-t border-neutral-200 pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Variables <span className="font-normal normal-case text-neutral-400">(CSS custom properties injected on the frontend)</span></p>
        <ThemeVarsEditor
          theme={theme}
          onSchemaSaved={(vars) => onSaved({ ...theme, variables: vars })}
        />
      </div>
    </div>
  );
}

function CreateThemePanel({ allThemeSlugs, onCreated }: { allThemeSlugs: string[]; onCreated: (theme: Theme) => void }) {
  const [slug, setSlug] = useState("");
  const [base, setBase] = useState("minimal");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const slugError = slug && !/^[a-z0-9-]+$/.test(slug) ? "Lowercase letters, numbers, and hyphens only" : null;

  async function create() {
    if (!slug || slugError) return;
    setCreating(true);
    setMessage(null);
    const res = await fetch("/api/v1/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, base }),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok) {
      setMessage({ text: json.data?.compiled ? "Theme created and compiled." : `Theme created but compilation had errors: ${json.data?.compileErrors?.join(", ")}`, ok: json.data?.compiled });
      onCreated(json.data as Theme);
      setSlug("");
    } else {
      setMessage({ text: json.error ?? "Failed to create theme.", ok: false });
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4 max-w-lg">
      <p className="text-xs text-neutral-500 leading-relaxed">
        Creates a new theme by copying an existing theme&apos;s source files. Custom themes are compiled on the server — no build step needed on your end.
        You can only import <code className="font-mono bg-neutral-100 px-1 rounded">react</code>, <code className="font-mono bg-neutral-100 px-1 rounded">next/link</code>, <code className="font-mono bg-neutral-100 px-1 rounded">next/navigation</code>, and <code className="font-mono bg-neutral-100 px-1 rounded">lucide-react</code> in custom theme files.
      </p>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Theme slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="my-theme"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none" />
          {slugError && <p className="text-xs text-red-600">{slugError}</p>}
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-600">Copy from</label>
          <select value={base} onChange={(e) => setBase(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none">
            {allThemeSlugs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={create} disabled={creating || !slug || !!slugError}
          className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          <Plus className="h-4 w-4" /> {creating ? "Creating…" : "Create theme"}
        </button>
        {message && (
          <span className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</span>
        )}
      </div>
    </div>
  );
}

export function ThemesManager({ themes: initial, initialAppearance }: { themes: Theme[]; initialAppearance: Record<string, unknown> }) {
  const [themes, setThemes] = useState(initial);
  const [activating, setActivating] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [compiling, setCompiling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [appearance, setAppearance] = useState<AppearanceState>({
    themeAccentColor: (initialAppearance.themeAccentColor as string) || "#171717",
    themeFontBody: (initialAppearance.themeFontBody as string) || "system",
    themeFontHeading: (initialAppearance.themeFontHeading as string) || "system",
    themeHeadingWeight: (initialAppearance.themeHeadingWeight as string) || "700",
    themeLogoUrl: (initialAppearance.themeLogoUrl as string) || "",
    themeFooterText: (initialAppearance.themeFooterText as string) || "",
    customCssVars: initialAppearance.customCssVars && typeof initialAppearance.customCssVars === "object"
      ? Object.entries(initialAppearance.customCssVars as Record<string, string>).map(([key, value]) => ({ key, value }))
      : [],
  });
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceMessage, setAppearanceMessage] = useState<string | null>(null);

  useEffect(() => {
    const url = buildAdminGoogleFontsUrl([appearance.themeFontBody, appearance.themeFontHeading]);
    if (!url) return;
    const existing = document.getElementById("carbon-admin-preview-fonts");
    if (existing) { (existing as HTMLLinkElement).href = url; return; }
    const link = document.createElement("link");
    link.id = "carbon-admin-preview-fonts";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }, [appearance.themeFontBody, appearance.themeFontHeading]);

  function setField<K extends keyof AppearanceState>(key: K, value: AppearanceState[K]) {
    setAppearance((prev) => ({ ...prev, [key]: value }));
  }

  async function activate(slug: string) {
    setActivating(slug);
    setBuildStatus("idle");
    setMessage(null);
    const res = await fetch("/api/v1/themes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: slug }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMessage(json.error ?? "Failed to activate theme.");
      setActivating(null);
      return;
    }
    setThemes((prev) => prev.map((t) => ({ ...t, active: t.slug === slug })));
    const renderModeRes = await fetch("/api/v1/settings?keys=renderMode");
    const renderJson = await renderModeRes.json().catch(() => ({}));
    const renderMode = renderJson.data?.renderMode ?? "ssr";
    if (renderMode === "csr") {
      setBuildStatus("building");
      setMessage("Theme activated. Rebuilding frontend — this takes 15–60 seconds…");
      const poll = setInterval(async () => {
        const statusRes = await fetch("/api/v1/settings?keys=buildStatus");
        const statusJson = await statusRes.json().catch(() => ({}));
        const status = statusJson.data?.buildStatus;
        if (status === "done") { clearInterval(poll); setBuildStatus("done"); setMessage("Rebuild complete. The new theme is live."); }
        else if (status === "error") { clearInterval(poll); setBuildStatus("error"); setMessage("Rebuild failed. Check server logs."); }
      }, 5000);
      setTimeout(() => clearInterval(poll), 120_000);
    } else {
      setBuildStatus("done");
      setMessage("Theme activated. Changes are live.");
    }
    setActivating(null);
  }

  async function recompile(slug: string) {
    setCompiling(slug);
    const res = await fetch(`/api/v1/themes/${slug}/compile`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setCompiling(null);
    if (res.ok && json.data?.compiled) {
      setThemes((prev) => prev.map((t) => t.slug === slug ? { ...t, compiled: true } : t));
    } else {
      alert(json.data?.errors?.join("\n") ?? json.error ?? "Compilation failed.");
    }
  }

  async function deleteTheme(slug: string) {
    if (!confirm(`Delete theme "${slug}"? This cannot be undone.`)) return;
    setDeleting(slug);
    const res = await fetch(`/api/v1/themes/${slug}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      setThemes((prev) => prev.filter((t) => t.slug !== slug));
      if (editingConfig === slug) setEditingConfig(null);
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Failed to delete theme.");
    }
  }

  async function saveAppearance(e: React.FormEvent) {
    e.preventDefault();
    setAppearanceSaving(true);
    setAppearanceMessage(null);
    const res = await fetch("/api/v1/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        themeAccentColor: appearance.themeAccentColor || null,
        themeFontBody: appearance.themeFontBody,
        themeFontHeading: appearance.themeFontHeading,
        themeHeadingWeight: appearance.themeHeadingWeight,
        themeLogoUrl: appearance.themeLogoUrl || null,
        themeFooterText: appearance.themeFooterText || null,
        customCssVars: appearance.customCssVars.length > 0
          ? Object.fromEntries(
              appearance.customCssVars
                .filter((r) => r.key.trim())
                .map((r) => [r.key.replace(/^--+/, "").trim(), r.value])
            )
          : null,
      }),
    });
    setAppearanceSaving(false);
    setAppearanceMessage(res.ok ? "Appearance saved." : "Failed to save.");
  }

  const allThemeSlugs = themes.map((t) => t.slug);
  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

  return (
    <div className="p-6 space-y-8">
      {/* Theme picker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">Installed themes</h2>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New theme
          </button>
        </div>

        {showCreate && (
          <CreateThemePanel
            allThemeSlugs={allThemeSlugs}
            onCreated={(theme) => {
              setThemes((prev) => [...prev, theme]);
              setShowCreate(false);
            }}
          />
        )}

        {message && (
          <div className={`rounded-md border px-4 py-3 text-sm flex items-center gap-2 ${buildStatus === "error" ? "bg-red-50 border-red-200 text-red-700" : buildStatus === "building" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-green-50 border-green-200 text-green-700"}`}>
            {buildStatus === "building" && <Loader2 className="h-4 w-4 animate-spin" />}
            {message}
          </div>
        )}

        <div className="space-y-3">
          {themes.map((theme) => (
            <div key={theme.slug}>
              <div className={`rounded-lg border bg-white p-5 transition-shadow ${theme.active ? "border-neutral-900 shadow-sm" : "border-neutral-200 hover:shadow-sm"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Palette className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-neutral-900 text-sm">{theme.name}</span>
                        <span className="text-xs text-neutral-400 font-mono">{theme.slug}</span>
                        {theme.active && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        )}
                        {!theme.builtin && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${theme.compiled ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                            {theme.compiled ? "Compiled" : "Not compiled"}
                          </span>
                        )}
                      </div>
                      {theme.description && <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{theme.description}</p>}
                      <p className="text-xs text-neutral-400 mt-0.5">{theme.version ? `v${theme.version}` : ""}{theme.author ? ` · ${theme.author}` : ""}{theme.builtin ? " · Built-in" : " · Custom"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {!theme.builtin && (
                      <>
                        <button
                          onClick={() => recompile(theme.slug)}
                          disabled={compiling === theme.slug}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                          title="Recompile theme"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${compiling === theme.slug ? "animate-spin" : ""}`} />
                          Recompile
                        </button>
                        <button
                          onClick={() => deleteTheme(theme.slug)}
                          disabled={theme.active || deleting === theme.slug}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          title={theme.active ? "Cannot delete the active theme" : "Delete theme"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditingConfig((v) => v === theme.slug ? null : theme.slug)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      {editingConfig === theme.slug ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Config
                    </button>
                    {!theme.active && (
                      <button
                        onClick={() => activate(theme.slug)}
                        disabled={activating === theme.slug || (!theme.builtin && !theme.compiled)}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                        title={!theme.builtin && !theme.compiled ? "Compile the theme before activating" : undefined}
                      >
                        {activating === theme.slug ? "Activating…" : "Activate"}
                      </button>
                    )}
                  </div>
                </div>

                {editingConfig === theme.slug && (
                  <ThemeConfigEditor
                    theme={theme}
                    allThemeSlugs={allThemeSlugs}
                    onSaved={(updated) => setThemes((prev) => prev.map((t) => t.slug === updated.slug ? updated : t))}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Appearance customization */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-800">Appearance</h2>
        <form onSubmit={saveAppearance} className="rounded-lg border border-neutral-200 bg-white p-5 space-y-5 max-w-xl">
          <div>
            <label className={labelClass}>Accent color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={appearance.themeAccentColor} onChange={(e) => setField("themeAccentColor", e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-neutral-300 p-0.5" />
              <input type="text" value={appearance.themeAccentColor} onChange={(e) => setField("themeAccentColor", e.target.value)} placeholder="#171717" className="w-32 rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
              <span className="text-xs text-neutral-400">Used for buttons and links</span>
            </div>
          </div>
          <FontSelect value={appearance.themeFontBody} onChange={(v) => setField("themeFontBody", v)} filter="body" label="Body font" />
          <FontSelect value={appearance.themeFontHeading} onChange={(v) => setField("themeFontHeading", v)} filter="heading" label="Heading font" />
          <div>
            <label className={labelClass}>Heading weight</label>
            <select value={appearance.themeHeadingWeight} onChange={(e) => setField("themeHeadingWeight", e.target.value)} className={inputClass}>
              {HEADING_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            <p className="mt-2 text-neutral-400 text-xs">Controls h1–h6 weight across the frontend.</p>
          </div>
          <div>
            <label className={labelClass}>Logo</label>
            <LogoPicker value={appearance.themeLogoUrl} onChange={(url) => setField("themeLogoUrl", url)} />
          </div>
          <div>
            <label className={labelClass}>Footer text</label>
            <textarea value={appearance.themeFooterText} onChange={(e) => setField("themeFooterText", e.target.value)} rows={2}
              placeholder={`© ${new Date().getFullYear()} Your Site. Powered by Carbon CMS.`} className={inputClass} />
            <p className="mt-1 text-xs text-neutral-400">Leave blank to use the default footer.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelClass + " mb-0"}>Custom CSS variables</label>
              <button type="button"
                onClick={() => setField("customCssVars", [...appearance.customCssVars, { key: "", value: "" }])}
                className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded px-2 py-1 transition-colors">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <p className="text-xs text-neutral-400">Site-level CSS custom properties injected on every page, after theme variables.</p>
            {appearance.customCssVars.length === 0 && (
              <p className="text-xs text-neutral-400 italic">No custom variables defined.</p>
            )}
            {appearance.customCssVars.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-neutral-400 shrink-0">--</span>
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => {
                    const updated = [...appearance.customCssVars];
                    updated[i] = { ...updated[i], key: e.target.value };
                    setField("customCssVars", updated);
                  }}
                  placeholder="variable-name"
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 font-mono text-sm focus:border-neutral-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => {
                    const updated = [...appearance.customCssVars];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setField("customCssVars", updated);
                  }}
                  placeholder="value"
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
                />
                <button type="button"
                  onClick={() => setField("customCssVars", appearance.customCssVars.filter((_, j) => j !== i))}
                  className="text-neutral-400 hover:text-red-600 transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={appearanceSaving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {appearanceSaving ? "Saving…" : "Save appearance"}
            </button>
            {appearanceMessage && (
              <span className={`text-sm ${appearanceMessage.includes("Failed") ? "text-red-600" : "text-green-700"}`}>{appearanceMessage}</span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
