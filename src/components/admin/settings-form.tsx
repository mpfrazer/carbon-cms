"use client";

import { useState } from "react";

interface Settings {
  siteTitle?: string;
  siteDescription?: string;
  siteUrl?: string;
  adminEmail?: string;
  postsPerPage?: number;
  allowComments?: boolean;
  commentModeration?: boolean;
}

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
            <input type="text" value={settings.siteTitle ?? ""} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Site description</label>
            <textarea value={settings.siteDescription ?? ""} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={2} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Site URL</label>
            <input type="url" value={settings.siteUrl ?? ""} onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" placeholder="https://example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Admin email</label>
            <input type="email" value={settings.adminEmail ?? ""} onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Reading</h2>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Posts per page</label>
            <input type="number" min={1} max={100} value={settings.postsPerPage ?? 10}
              onChange={(e) => setSettings({ ...settings, postsPerPage: parseInt(e.target.value) })}
              className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500" />
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
