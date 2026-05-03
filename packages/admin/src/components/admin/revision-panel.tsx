"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";

interface Revision {
  id: string;
  savedAt: string;
  savedByName: string | null;
  title: string;
  status: string;
}

interface RevisionPanelProps {
  contentType: "posts" | "pages";
  contentId: string;
  onRestored: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
  archived: "Archived",
};

export function RevisionPanel({ contentType, contentId, onRestored }: RevisionPanelProps) {
  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/${contentType}/${contentId}/revisions`)
      .then((r) => r.json())
      .then((j) => setRevisions(j.data ?? []))
      .catch(() => setError("Failed to load revisions."))
      .finally(() => setLoading(false));
  }, [open, contentType, contentId]);

  async function handleRestore(revisionId: string, title: string) {
    if (!confirm(`Restore to "${title}"? The current content will be overwritten.`)) return;
    setRestoring(revisionId);
    try {
      const res = await fetch(
        `/api/v1/${contentType}/${contentId}/revisions/${revisionId}/restore`,
        { method: "POST" }
      );
      if (res.ok) {
        onRestored();
      } else {
        setError("Restore failed.");
      }
    } catch {
      setError("Restore failed.");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <details
      className="rounded-md border border-neutral-200 dark:border-neutral-700"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
        <History className="h-4 w-4 shrink-0" />
        Revision history
      </summary>

      <div className="border-t border-neutral-100 dark:border-neutral-700">
        {error && (
          <p className="px-4 py-4 text-center text-sm text-red-600">{error}</p>
        )}
        {loading && (
          <p className="px-4 py-6 text-center text-sm text-neutral-400">Loading…</p>
        )}
        {!loading && !error && revisions.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-neutral-400">No revisions yet.</p>
        )}
        {!loading && !error && revisions.length > 0 && (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
            {revisions.map((rev, i) => (
              <li key={rev.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{rev.title}</p>
                  <p className="text-xs text-neutral-400">
                    {new Date(rev.savedAt).toLocaleString()}
                    {rev.savedByName ? ` · ${rev.savedByName}` : ""}
                    {" · "}
                    <span className="text-neutral-500">{STATUS_LABELS[rev.status] ?? rev.status}</span>
                    {i === 0 && (
                      <span className="ml-2 rounded-full bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        current
                      </span>
                    )}
                  </p>
                </div>
                {i > 0 && (
                  <button
                    type="button"
                    disabled={restoring === rev.id}
                    onClick={() => handleRestore(rev.id, rev.title)}
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {restoring === rev.id ? "Restoring…" : "Restore"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
