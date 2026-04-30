"use client";

import { useEffect, useState } from "react";
import { Palette, Check, Loader2, ImageIcon } from "lucide-react";
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

function FontSelect({
  value,
  onChange,
  filter,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  filter: "body" | "heading";
  label: string;
}) {
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
            {fonts.map((f) => (
              <option key={f.name} value={f.name}>{f.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="mt-2 text-base text-neutral-500 truncate" style={{ fontFamily: previewStack }}>
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
}

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
}

interface AppearanceState {
  themeAccentColor: string;
  themeFontBody: string;
  themeFontHeading: string;
  themeHeadingWeight: string;
  themeLogoUrl: string;
  themeFooterText: string;
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
      {/* Also allow pasting a URL directly */}
      <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste an image URL…" className={inputClass} />

      <MediaPickerModal
        title="Choose logo"
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(item) => onChange(item.url)}
      />
    </div>
  );
}

export function ThemesManager({
  themes: initial,
  initialAppearance,
}: {
  themes: Theme[];
  initialAppearance: Record<string, unknown>;
}) {
  const [themes, setThemes] = useState(initial);
  const [activating, setActivating] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const [appearance, setAppearance] = useState<AppearanceState>({
    themeAccentColor: (initialAppearance.themeAccentColor as string) || "#171717",
    themeFontBody: (initialAppearance.themeFontBody as string) || "system",
    themeFontHeading: (initialAppearance.themeFontHeading as string) || "system",
    themeHeadingWeight: (initialAppearance.themeHeadingWeight as string) || "700",
    themeLogoUrl: (initialAppearance.themeLogoUrl as string) || "",
    themeFooterText: (initialAppearance.themeFooterText as string) || "",
  });
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceMessage, setAppearanceMessage] = useState<string | null>(null);

  // Inject Google Fonts into the admin page for live preview
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

  async function activate(name: string) {
    setActivating(name);
    setBuildStatus("idle");
    setMessage(null);

    const res = await fetch("/api/v1/themes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: name }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setMessage(json.error ?? "Failed to activate theme.");
      setActivating(null);
      return;
    }

    setThemes((prev) => prev.map((t) => ({ ...t, active: t.name === name })));

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
        if (status === "done") {
          clearInterval(poll);
          setBuildStatus("done");
          setMessage("Rebuild complete. The new theme is live.");
        } else if (status === "error") {
          clearInterval(poll);
          setBuildStatus("error");
          setMessage("Rebuild failed. Check server logs.");
        }
      }, 5000);
      setTimeout(() => clearInterval(poll), 120_000);
    } else {
      setBuildStatus("done");
      setMessage("Theme activated. Changes are live.");
    }

    setActivating(null);
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
      }),
    });
    setAppearanceSaving(false);
    setAppearanceMessage(res.ok ? "Appearance saved." : "Failed to save.");
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

  return (
    <div className="p-6 space-y-8">
      {/* Theme picker */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-800">Active theme</h2>
        {message && (
          <div className={`rounded-md border px-4 py-3 text-sm flex items-center gap-2 ${buildStatus === "error" ? "bg-red-50 border-red-200 text-red-700" : buildStatus === "building" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-green-50 border-green-200 text-green-700"}`}>
            {buildStatus === "building" && <Loader2 className="h-4 w-4 animate-spin" />}
            {message}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <div key={theme.name} className={`rounded-lg border bg-white p-5 transition-shadow ${theme.active ? "border-neutral-900 shadow-sm" : "border-neutral-200 hover:shadow-sm"}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span className="font-medium text-neutral-900 text-sm">{theme.name}</span>
                </div>
                {theme.active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              {theme.description && <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{theme.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">{theme.version ? `v${theme.version}` : ""}{theme.author ? ` · ${theme.author}` : ""}</span>
                {!theme.active && (
                  <button onClick={() => activate(theme.name)} disabled={activating === theme.name}
                    className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
                    {activating === theme.name ? "Activating…" : "Activate"}
                  </button>
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
          {/* Accent color */}
          <div>
            <label className={labelClass}>Accent color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={appearance.themeAccentColor}
                onChange={(e) => setField("themeAccentColor", e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-neutral-300 p-0.5"
              />
              <input
                type="text"
                value={appearance.themeAccentColor}
                onChange={(e) => setField("themeAccentColor", e.target.value)}
                placeholder="#171717"
                className="w-32 rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
              <span className="text-xs text-neutral-400">Used for buttons and links</span>
            </div>
          </div>

          {/* Body font */}
          <FontSelect
            value={appearance.themeFontBody}
            onChange={(v) => setField("themeFontBody", v)}
            filter="body"
            label="Body font"
          />

          {/* Heading font + weight */}
          <FontSelect
            value={appearance.themeFontHeading}
            onChange={(v) => setField("themeFontHeading", v)}
            filter="heading"
            label="Heading font"
          />

          <div>
            <label className={labelClass}>Heading weight</label>
            <select value={appearance.themeHeadingWeight} onChange={(e) => setField("themeHeadingWeight", e.target.value)} className={inputClass}>
              {HEADING_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
            <p className="mt-2 text-neutral-400 text-xs">Controls h1–h6 weight across the frontend.</p>
          </div>

          {/* Logo */}
          <div>
            <label className={labelClass}>Logo</label>
            <LogoPicker value={appearance.themeLogoUrl} onChange={(url) => setField("themeLogoUrl", url)} />
          </div>

          {/* Footer text */}
          <div>
            <label className={labelClass}>Footer text</label>
            <textarea
              value={appearance.themeFooterText}
              onChange={(e) => setField("themeFooterText", e.target.value)}
              rows={2}
              placeholder={`© ${new Date().getFullYear()} Your Site. Powered by Carbon CMS.`}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-400">Leave blank to use the default footer.</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={appearanceSaving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {appearanceSaving ? "Saving…" : "Save appearance"}
            </button>
            {appearanceMessage && (
              <span className={`text-sm ${appearanceMessage.includes("Failed") ? "text-red-600" : "text-green-700"}`}>
                {appearanceMessage}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
