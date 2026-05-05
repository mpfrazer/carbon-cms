"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";

const ALL_SCOPES = [
  { value: "content:read", label: "Read content (posts, pages, taxonomies)" },
  { value: "content:write", label: "Manage content (write, publish, review)" },
  { value: "media:read", label: "Read media library" },
  { value: "media:write", label: "Upload and manage media" },
  { value: "comments:read", label: "Read comments (incl. moderation queue)" },
  { value: "comments:moderate", label: "Moderate comments" },
  { value: "settings:read", label: "Read site settings" },
  { value: "settings:write", label: "Update site settings" },
  { value: "themes:read", label: "Read theme config" },
  { value: "themes:write", label: "Install and configure themes" },
  { value: "users:read", label: "List users" },
  { value: "users:write", label: "Create and edit users" },
  { value: "webhooks:read", label: "List webhooks and delivery history" },
  { value: "webhooks:write", label: "Register, edit, and test webhooks" },
  { value: "stats:read", label: "Read site stats" },
] as const;

type Scope = (typeof ALL_SCOPES)[number]["value"];

const READ_ONLY_SCOPES: Scope[] = ALL_SCOPES.filter((s) => s.value.endsWith(":read")).map((s) => s.value);

const PRESETS: { value: string; label: string; description: string; scopes: Scope[] }[] = [
  {
    value: "read-only",
    label: "Read-only",
    description: "Read access to every resource. Good for static-site rebuilders, search indexers, and dashboards.",
    scopes: READ_ONLY_SCOPES,
  },
  {
    value: "content-publisher",
    label: "Content publisher",
    description: "Read and write posts, pages, taxonomies, and media. For migration tools and headless publishing.",
    scopes: ["content:read", "content:write", "media:read", "media:write"],
  },
  {
    value: "moderator",
    label: "Moderator",
    description: "Read and moderate comments. For external moderation services.",
    scopes: ["comments:read", "comments:moderate"],
  },
  {
    value: "webhook-integrator",
    label: "Webhook integrator",
    description: "Register and manage webhook subscriptions programmatically.",
    scopes: ["webhooks:read", "webhooks:write"],
  },
  {
    value: "custom",
    label: "Custom — choose individual scopes",
    description: "Pick exactly the scopes this key needs. Recommended for production integrations.",
    scopes: [],
  },
];

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: Scope[];
  lastUsedAt: string | null;
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-1 rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [presetValue, setPresetValue] = useState<string>("read-only");
  const [customScopes, setCustomScopes] = useState<Scope[]>([]);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCustom = presetValue === "custom";
  const selectedPreset = PRESETS.find((p) => p.value === presetValue);
  const effectiveScopes: Scope[] = isCustom ? customScopes : (selectedPreset?.scopes ?? []);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/api-keys");
      if (res.ok) {
        const json = await res.json();
        setKeys(json.data ?? []);
      }
    } catch {
      // network error — keep previous state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadKeys(); }, []);

  function selectPreset(value: string) {
    setPresetValue(value);
    // Seed the custom checkboxes from the preset the user is leaving, so
    // switching to "Custom" feels like a tweak rather than a reset.
    if (value === "custom" && customScopes.length === 0) {
      const previousPreset = PRESETS.find((p) => p.value === presetValue);
      setCustomScopes(previousPreset?.scopes ?? []);
    }
  }

  function toggleScope(scope: Scope) {
    setCustomScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (effectiveScopes.length === 0) {
      setError("Select at least one scope.");
      return;
    }
    setCreating(true);
    setError(null);
    setNewKey(null);

    const res = await fetch("/api/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), scopes: effectiveScopes }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to create key");
    } else {
      setNewKey(json.data.key);
      setName("");
      setPresetValue("read-only");
      setCustomScopes([]);
      loadKeys();
    }
    setCreating(false);
  }

  async function handleRevoke(id: string, keyName: string) {
    if (!confirm(`Revoke "${keyName}"? Any requests using this key will stop working immediately.`)) return;
    await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
    setNewKey(null);
    loadKeys();
  }

  const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <div className="p-6 max-w-3xl space-y-8">
      {/* Create */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Create new key</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Give the key a name that identifies its consumer (e.g. &ldquo;Personal brand site&rdquo;) and pick the scopes it should have. The key is shown only once — copy it before leaving.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name"
              required
              className={inputClass + " w-full"}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Scopes</label>
            <select
              value={presetValue}
              onChange={(e) => selectPreset(e.target.value)}
              className={inputClass + " w-full"}
              aria-label="Scope preset"
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {selectedPreset?.description}
            </p>
          </div>

          {isCustom ? (
            <div className="space-y-2 rounded-md border border-neutral-200 dark:border-neutral-700 p-3">
              <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Select individual scopes</p>
              <div className="grid grid-cols-1 gap-1.5">
                {ALL_SCOPES.map((s) => (
                  <label key={s.value} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={customScopes.includes(s.value)}
                      onChange={() => toggleScope(s.value)}
                      className="mt-0.5"
                    />
                    <span>
                      <code className="font-mono text-[11px] text-neutral-900 dark:text-neutral-100">{s.value}</code>
                      <span className="ml-1.5 text-neutral-500 dark:text-neutral-400">— {s.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            effectiveScopes.length > 0 && (
              <div className="rounded-md bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Grants:</p>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {effectiveScopes.map((s) => (
                    <li key={s} className="font-mono text-[11px] rounded bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 text-neutral-700 dark:text-neutral-200">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          <button
            type="submit"
            disabled={creating || !name.trim() || effectiveScopes.length === 0}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {newKey && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-1">
            <p className="text-xs font-medium text-green-800">Key created — copy it now. It will not be shown again.</p>
            <div className="flex items-center gap-1 font-mono text-sm text-green-900 break-all">
              {newKey}
              <CopyButton text={newKey} />
            </div>
          </div>
        )}
      </section>

      {/* List */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Active keys</h2>

        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-neutral-400">No active API keys.</p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50 rounded-md border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
            {keys.map((k) => (
              <div key={k.id} className="flex items-start justify-between px-4 py-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{k.name}</p>
                  <p className="font-mono text-xs text-neutral-400">{k.keyPrefix}••••••••••••••••••••••••••••••••••</p>
                  {k.scopes.length > 0 && (
                    <ul className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <li key={s} className="font-mono text-[10px] rounded bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 text-neutral-600 dark:text-neutral-300">
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-neutral-400">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : " · Never used"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(k.id, k.name)}
                  title="Revoke key"
                  className="ml-3 rounded p-1.5 text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
        <p className="font-medium text-neutral-700 dark:text-neutral-300">Using an API key</p>
        <p>Pass the key in the <code className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 rounded">Authorization</code> header on requests to the Carbon API:</p>
        <pre className="mt-1 rounded bg-neutral-100 dark:bg-neutral-700 p-2 font-mono text-xs overflow-x-auto">{"Authorization: Bearer <your-key>"}</pre>
      </section>
    </div>
  );
}
