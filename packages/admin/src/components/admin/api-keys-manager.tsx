"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";

type ApiKeyRole = "admin" | "editor" | "author" | "subscriber";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  role: ApiKeyRole;
  lastUsedAt: string | null;
  createdAt: string;
}

const ROLE_OPTIONS: { value: ApiKeyRole; label: string; description: string }[] = [
  { value: "subscriber", label: "Subscriber", description: "Read-only access to public content" },
  { value: "author", label: "Author", description: "Manage own posts and pages" },
  { value: "editor", label: "Editor", description: "Manage all content and moderate comments" },
  { value: "admin", label: "Admin", description: "Full access, including settings and other API keys" },
];

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
  const [role, setRole] = useState<ApiKeyRole>("subscriber");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    setNewKey(null);

    const res = await fetch("/api/v1/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to create key");
    } else {
      setNewKey(json.data.key);
      setName("");
      setRole("subscriber");
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
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Give the key a name that identifies its consumer (e.g. &ldquo;Personal brand site&rdquo;). The key is shown only once — copy it before leaving.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Key name"
              required
              className={inputClass + " flex-1"}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ApiKeyRole)}
              className={inputClass}
              aria-label="Role"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {ROLE_OPTIONS.find((r) => r.value === role)?.description}
          </p>
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
              <div key={k.id} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {k.name}
                    <span className="ml-2 inline-block rounded bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 text-xs font-normal text-neutral-600 dark:text-neutral-300">
                      {k.role}
                    </span>
                  </p>
                  <p className="font-mono text-xs text-neutral-400">{k.keyPrefix}••••••••••••••••••••••••••••••••••</p>
                  <p className="text-xs text-neutral-400">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : " · Never used"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(k.id, k.name)}
                  title="Revoke key"
                  className="rounded p-1.5 text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
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
