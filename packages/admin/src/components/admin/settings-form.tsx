"use client";

import { useState } from "react";

interface Settings {
  siteTitle?: string;
  siteDescription?: string;
  siteUrl?: string;
  adminEmail?: string;
  postsPerPage?: number;
  renderMode?: "ssr" | "csr";
  allowComments?: boolean;
  commentModeration?: boolean;
  aiProvider?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
}

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", modelHint: "gpt-4o" },
  { value: "anthropic", label: "Anthropic", baseUrl: "", modelHint: "claude-sonnet-4-6" },
  { value: "groq", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", modelHint: "llama-3.3-70b-versatile" },
  { value: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", modelHint: "anthropic/claude-3.5-sonnet" },
  { value: "ollama", label: "Ollama (local)", baseUrl: "http://localhost:11434/v1", modelHint: "llama3.2" },
  { value: "custom", label: "Custom / LiteLLM proxy", baseUrl: "", modelHint: "" },
];

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/v1/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleProviderChange(value: string) {
    const preset = AI_PROVIDERS.find((p) => p.value === value);
    setSettings((s) => ({
      ...s,
      aiProvider: value,
      aiBaseUrl: preset?.baseUrl ?? s.aiBaseUrl ?? "",
      aiModel: preset?.modelHint ?? s.aiModel ?? "",
    }));
    setAiTestResult(null);
  }

  async function testAiConnection() {
    setAiTesting(true);
    setAiTestResult(null);

    // Save first so the API reads the latest values
    await fetch("/api/v1/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    try {
      const res = await fetch("/api/v1/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "test", ctx: {} }),
      });
      const json = await res.json();
      if (res.ok && json.result?.toLowerCase().includes("ok")) {
        setAiTestResult({ ok: true, message: "Connected successfully." });
      } else {
        setAiTestResult({ ok: false, message: json.error ?? json.result ?? "Unexpected response." });
      }
    } catch {
      setAiTestResult({ ok: false, message: "Network error." });
    } finally {
      setAiTesting(false);
    }
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  const selectedProvider = AI_PROVIDERS.find((p) => p.value === settings.aiProvider);
  const needsApiKey = settings.aiProvider && settings.aiProvider !== "ollama";

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {saved && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Settings saved.
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">General</h2>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Site title</label>
            <input type="text" value={settings.siteTitle ?? ""} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Site description</label>
            <textarea value={settings.siteDescription ?? ""} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={2} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Site URL</label>
            <input type="url" value={settings.siteUrl ?? ""} onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
              className={inputClass} placeholder="https://example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Admin email</label>
            <input type="email" value={settings.adminEmail ?? ""} onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })} className={inputClass} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Reading</h2>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Posts per page</label>
            <input type="number" min={1} max={100} value={settings.postsPerPage ?? 10}
              onChange={(e) => setSettings({ ...settings, postsPerPage: parseInt(e.target.value) })}
              className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Comments</h2>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="allowComments" checked={settings.allowComments ?? true}
              onChange={(e) => setSettings({ ...settings, allowComments: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300" />
            <label htmlFor="allowComments" className="text-sm text-neutral-700">Allow comments on posts</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="commentModeration" checked={settings.commentModeration ?? true}
              onChange={(e) => setSettings({ ...settings, commentModeration: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-300" />
            <label htmlFor="commentModeration" className="text-sm text-neutral-700">Hold comments for moderation</label>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">AI Writing Tools</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Connect your own AI provider. Works with OpenAI, Anthropic, Groq, Ollama, or any OpenAI-compatible API.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Provider</label>
            <select
              value={settings.aiProvider ?? ""}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            >
              <option value="">— Select a provider —</option>
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {needsApiKey && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">API key</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.aiApiKey ?? ""}
                  onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                  className={inputClass + " pr-16"}
                  placeholder="sk-…"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Model</label>
            <input
              type="text"
              value={settings.aiModel ?? ""}
              onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
              className={inputClass}
              placeholder={selectedProvider?.modelHint ?? "e.g. gpt-4o"}
            />
          </div>

          {(settings.aiProvider === "custom" || settings.aiProvider === "ollama" || settings.aiProvider === "openrouter" || settings.aiProvider === "groq") && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Base URL</label>
              <input
                type="url"
                value={settings.aiBaseUrl ?? ""}
                onChange={(e) => setSettings({ ...settings, aiBaseUrl: e.target.value })}
                className={inputClass}
                placeholder="https://…"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={testAiConnection}
              disabled={aiTesting || !settings.aiProvider || !settings.aiModel}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              {aiTesting ? "Testing…" : "Test connection"}
            </button>
            {aiTestResult && (
              <span className={`text-sm ${aiTestResult.ok ? "text-green-700" : "text-red-600"}`}>
                {aiTestResult.ok ? "✓" : "✗"} {aiTestResult.message}
              </span>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Performance</h2>
            <p className="mt-1 text-xs text-neutral-500">Controls how your public site renders pages to visitors.</p>
          </div>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="renderMode"
                value="ssr"
                checked={(settings.renderMode ?? "ssr") === "ssr"}
                onChange={() => setSettings({ ...settings, renderMode: "ssr" })}
                className="mt-0.5 h-4 w-4 border-neutral-300"
              />
              <div>
                <span className="block text-sm font-medium text-neutral-700">Server-Side Rendering (SSR)</span>
                <span className="block text-xs text-neutral-500 mt-0.5">
                  Pages are built on the server each time a visitor loads them. Theme changes go live immediately without a rebuild.
                  Uses more server resources and pages are not cached at the edge.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="renderMode"
                value="csr"
                checked={settings.renderMode === "csr"}
                onChange={() => setSettings({ ...settings, renderMode: "csr" })}
                className="mt-0.5 h-4 w-4 border-neutral-300"
              />
              <div>
                <span className="block text-sm font-medium text-neutral-700">Static / Client-Side Rendering (CSR)</span>
                <span className="block text-xs text-neutral-500 mt-0.5">
                  Pages are pre-built and served as static files from a CDN. Faster page loads and lower server load,
                  but theme changes require a rebuild (typically 15–60 seconds) before they appear.
                </span>
              </div>
            </label>
            <p className="text-xs text-neutral-400">
              If you are unsure, start with SSR. You can switch to CSR later when you are ready to optimise for performance.
            </p>
          </div>
        </section>

        <div className="pt-2">
          <button type="submit" disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
