"use client";

import { useState } from "react";
import { Palette, Check, Loader2 } from "lucide-react";

interface Theme {
  name: string;
  active: boolean;
  version?: string;
  author?: string;
  description?: string;
}

export function ThemesManager({ themes: initial }: { themes: Theme[] }) {
  const [themes, setThemes] = useState(initial);
  const [activating, setActivating] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

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
      // Poll build-status (frontend sets it via the rebuild webhook response)
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

  return (
    <div className="p-6 space-y-6">
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
                <button
                  onClick={() => activate(theme.name)}
                  disabled={activating === theme.name}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                >
                  {activating === theme.name ? "Activating…" : "Activate"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
