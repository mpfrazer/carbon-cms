"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp, Trash2, Zap, Edit2, X } from "lucide-react";

const ALL_EVENTS = [
  { value: "post.created", label: "Post created" },
  { value: "post.published", label: "Post published" },
  { value: "post.updated", label: "Post updated" },
  { value: "post.deleted", label: "Post deleted" },
  { value: "page.created", label: "Page created" },
  { value: "page.published", label: "Page published" },
  { value: "page.updated", label: "Page updated" },
  { value: "page.deleted", label: "Page deleted" },
  { value: "comment.created", label: "Comment created" },
  { value: "comment.approved", label: "Comment approved" },
  { value: "media.uploaded", label: "Media uploaded" },
  { value: "media.deleted", label: "Media deleted" },
];

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

interface Delivery {
  id: string;
  event: string;
  status: string;
  responseStatus: number | null;
  attempts: number;
  lastAttemptAt: string;
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
    <button type="button" onClick={handleCopy} title="Copy"
      className="ml-1 rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function EventCheckboxes({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter((e) => e !== val) : [...selected, val]);
  }
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ALL_EVENTS.map((ev) => (
        <label key={ev.value} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={selected.includes(ev.value)} onChange={() => toggle(ev.value)}
            className="h-4 w-4 rounded border-neutral-300" />
          {ev.label}
        </label>
      ))}
    </div>
  );
}

function DeliveryLog({ webhookId }: { webhookId: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);

  useEffect(() => {
    fetch(`/api/v1/webhooks/${webhookId}/deliveries`)
      .then((r) => r.json())
      .then((j) => setDeliveries(j.data ?? []));
  }, [webhookId]);

  if (!deliveries) return <p className="text-xs text-neutral-400 py-2">Loading…</p>;
  if (deliveries.length === 0) return <p className="text-xs text-neutral-400 py-2">No deliveries yet.</p>;

  return (
    <div className="divide-y divide-neutral-100 text-xs">
      {deliveries.map((d) => (
        <div key={d.id} className="flex items-center justify-between py-2 gap-4">
          <span className="font-mono text-neutral-500">{d.event}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${
            d.status === "delivered" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}>
            {d.status === "delivered" ? `${d.responseStatus} OK` : `Failed${d.responseStatus ? ` (${d.responseStatus})` : ""}`}
          </span>
          <span className="text-neutral-400">{new Date(d.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail">>({});

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [createEvents, setCreateEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState<string[]>([]);

  async function loadWebhooks() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/webhooks");
      if (res.ok) {
        const json = await res.json();
        setWebhooks(json.data ?? []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWebhooks(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createEvents.length) { setError("Select at least one event"); return; }
    setError(null);
    setCreating(true);
    const res = await fetch("/api/v1/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName.trim(), url: createUrl.trim(), events: createEvents }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to create webhook");
    } else {
      setNewSecret({ id: json.data.id, secret: json.data.secret });
      setCreateName(""); setCreateUrl(""); setCreateEvents([]);
      loadWebhooks();
    }
    setCreating(false);
  }

  function startEdit(w: Webhook) {
    setEditingId(w.id);
    setEditName(w.name);
    setEditUrl(w.url);
    setEditEvents(w.events);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const res = await fetch(`/api/v1/webhooks/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), url: editUrl.trim(), events: editEvents }),
    });
    if (res.ok) { setEditingId(null); loadWebhooks(); }
  }

  async function handleToggleActive(w: Webhook) {
    await fetch(`/api/v1/webhooks/${w.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !w.active }),
    });
    loadWebhooks();
  }

  async function handleDelete(w: Webhook) {
    if (!confirm(`Delete webhook "${w.name}"? This will also delete all delivery logs.`)) return;
    await fetch(`/api/v1/webhooks/${w.id}`, { method: "DELETE" });
    if (newSecret?.id === w.id) setNewSecret(null);
    loadWebhooks();
  }

  async function handleTest(w: Webhook) {
    setTesting(w.id);
    const res = await fetch(`/api/v1/webhooks/${w.id}/test`, { method: "POST" });
    const json = await res.json();
    setTestResult((prev) => ({ ...prev, [w.id]: json.data?.status === "delivered" ? "ok" : "fail" }));
    setTesting(null);
    setTimeout(() => setTestResult((prev) => { const n = { ...prev }; delete n[w.id]; return n; }), 4000);
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <div className="p-6 max-w-3xl space-y-8">

      {/* Create */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-800">Create webhook</h2>
          <p className="mt-1 text-xs text-neutral-500">Carbon will POST a signed JSON payload to your URL when selected events occur.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Name</label>
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)}
                required placeholder="e.g. Personal brand site" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">URL</label>
              <input type="url" value={createUrl} onChange={(e) => setCreateUrl(e.target.value)}
                required placeholder="https://example.com/webhook" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Events</label>
            <EventCheckboxes selected={createEvents} onChange={setCreateEvents} />
          </div>

          <button type="submit" disabled={creating || !createEvents.length}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {creating ? "Creating…" : "Create webhook"}
          </button>
        </form>

        {newSecret && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-1">
            <p className="text-xs font-medium text-green-800">Webhook created — copy the secret now. It will not be shown again.</p>
            <div className="flex items-center gap-1 font-mono text-sm text-green-900 break-all">
              {newSecret.secret}
              <CopyButton text={newSecret.secret} />
            </div>
            <p className="text-xs text-green-700 mt-1">
              Verify incoming requests by checking the <code className="bg-green-100 px-1 rounded">X-Carbon-Signature</code> header:
              {" "}<code className="bg-green-100 px-1 rounded">sha256=HMAC-SHA256(secret, rawBody)</code>
            </p>
          </div>
        )}
      </section>

      {/* List */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-800">Configured webhooks</h2>

        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : webhooks.length === 0 ? (
          <p className="text-sm text-neutral-400">No webhooks configured.</p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50 rounded-md border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
            {webhooks.map((w) => (
              <div key={w.id} className="px-4 py-4 space-y-3">
                {editingId === w.id ? (
                  <form onSubmit={handleEdit} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                        required className={inputClass} placeholder="Name" />
                      <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)}
                        required className={inputClass} placeholder="URL" />
                    </div>
                    <EventCheckboxes selected={editEvents} onChange={setEditEvents} />
                    <div className="flex gap-2">
                      <button type="submit"
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition-colors">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{w.name}</p>
                        <p className="text-xs font-mono text-neutral-400 truncate">{w.url}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {w.events.map((ev) => (
                            <span key={ev} className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-300">{ev}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Active toggle */}
                        <button type="button" onClick={() => handleToggleActive(w)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            w.active ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                          }`}>
                          {w.active ? "Active" : "Paused"}
                        </button>
                        {/* Test */}
                        <button type="button" onClick={() => handleTest(w)} disabled={!!testing}
                          title="Send test ping"
                          className={`rounded p-1.5 transition-colors ${
                            testResult[w.id] === "ok" ? "text-green-600 dark:text-green-400" :
                            testResult[w.id] === "fail" ? "text-red-500" :
                            "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
                          }`}>
                          <Zap className="h-4 w-4" />
                        </button>
                        {/* Edit */}
                        <button type="button" onClick={() => startEdit(w)} title="Edit"
                          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {/* Delete */}
                        <button type="button" onClick={() => handleDelete(w)} title="Delete"
                          className="rounded p-1.5 text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Delivery log toggle */}
                    <button type="button"
                      onClick={() => setExpandedLog(expandedLog === w.id ? null : w.id)}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
                      {expandedLog === w.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Delivery log
                    </button>
                    {expandedLog === w.id && (
                      <div className="border-t border-neutral-100 dark:border-neutral-700 pt-2">
                        <DeliveryLog webhookId={w.id} />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verification guide */}
      <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600 space-y-2">
        <p className="font-medium text-neutral-700">Verifying webhook signatures</p>
        <p>Every delivery includes an <code className="font-mono bg-neutral-100 px-1 rounded">X-Carbon-Signature</code> header. Compute <code className="font-mono bg-neutral-100 px-1 rounded">sha256=HMAC-SHA256(secret, rawBody)</code> and compare it to the header value. Reject requests that do not match.</p>
        <pre className="mt-1 rounded bg-neutral-100 p-2 font-mono overflow-x-auto whitespace-pre-wrap">{`// Node.js example
const crypto = require('crypto');
const sig = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody).digest('hex');
if (\`sha256=\${sig}\` !== req.headers['x-carbon-signature']) {
  return res.status(401).end();
}`}</pre>
      </section>

    </div>
  );
}
