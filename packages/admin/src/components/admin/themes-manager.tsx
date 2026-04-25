"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Palette, Check, Loader2, ImageIcon, X } from "lucide-react";

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
}

interface MediaItem { id: string; url: string; altText: string | null; mimeType: string; }

interface AppearanceState {
  themeAccentColor: string;
  themeFontBody: string;
  themeFontHeading: string;
  themeLogoUrl: string;
  themeFooterText: string;
}

const FONT_OPTIONS = [
  { value: "system", label: "System (sans-serif)" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const HEADING_FONT_OPTIONS = [
  { value: "system", label: "System (sans-serif)" },
  { value: "serif", label: "Serif" },
];

function LogoPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/v1/media?pageSize=100")
      .then((r) => r.json())
      .then((j) => setImages((j.data ?? []).filter((m: MediaItem) => m.mimeType.startsWith("image/"))));

    function onClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/v1/media", { method: "POST", body: form });
    const json = await res.json();
    if (res.ok) { onChange(json.data.url); setOpen(false); }
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = "";
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-40 rounded border border-neutral-200 bg-neutral-50 overflow-hidden">
            <Image src={value} alt="Logo" fill className="object-contain p-1" />
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div ref={modalRef} className="w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <span className="text-sm font-semibold text-neutral-800">Choose logo</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => uploadRef.current?.click()} disabled={uploading}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors">
                  {uploading ? "Uploading…" : "Upload new"}
                </button>
                <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <button type="button" onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-3 gap-3">
              {images.map((img) => (
                <button key={img.id} type="button"
                  onClick={() => { onChange(img.url); setOpen(false); }}
                  className="rounded-md overflow-hidden border-2 border-transparent hover:border-neutral-300 transition-colors">
                  <Image src={img.url} alt={img.altText ?? ""} width={300} height={200} className="w-full h-24 object-contain bg-neutral-50 p-2" />
                </button>
              ))}
              {images.length === 0 && !uploading && (
                <p className="col-span-3 py-8 text-center text-sm text-neutral-400">No images yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
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
    themeLogoUrl: (initialAppearance.themeLogoUrl as string) || "",
    themeFooterText: (initialAppearance.themeFooterText as string) || "",
  });
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceMessage, setAppearanceMessage] = useState<string | null>(null);

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
          <div>
            <label className={labelClass}>Body font</label>
            <select value={appearance.themeFontBody} onChange={(e) => setField("themeFontBody", e.target.value)} className={inputClass}>
              {FONT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Heading font */}
          <div>
            <label className={labelClass}>Heading font</label>
            <select value={appearance.themeFontHeading} onChange={(e) => setField("themeFontHeading", e.target.value)} className={inputClass}>
              {HEADING_FONT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
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
