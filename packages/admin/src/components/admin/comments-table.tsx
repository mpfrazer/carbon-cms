"use client";

import { useEffect, useState } from "react";

const statusColors: Record<string, string> = {
  approved: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  spam: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  trash: "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
};

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  postId: string;
  postTitle: string | null;
  postSlug: string | null;
  editedAt: string | null;
  createdAt: string;
}

const TABS = ["all", "pending", "approved", "spam", "trash"] as const;
type Tab = (typeof TABS)[number];

export function CommentsTable() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Tab>("pending");
  const [counts, setCounts] = useState<Record<Tab, number>>({ all: 0, pending: 0, approved: 0, spam: 0, trash: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCounts() {
    const results = await Promise.all(
      TABS.map(async (tab) => {
        const qs = tab === "all" ? "" : `&status=${tab}`;
        const res = await fetch(`/api/v1/comments?pageSize=1${qs}`);
        const json = await res.json();
        return [tab, json.pagination?.total ?? 0] as [Tab, number];
      })
    );
    setCounts(Object.fromEntries(results) as Record<Tab, number>);
  }

  async function loadComments(tab: Tab) {
    setLoading(true);
    const qs = tab === "all" ? "" : `&status=${tab}`;
    const res = await fetch(`/api/v1/comments?pageSize=50${qs}`);
    const json = await res.json();
    setComments(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    loadComments(filter);
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/v1/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await Promise.all([loadComments(filter), loadCounts()]);
  }

  async function deleteComment(id: string) {
    setDeletingId(id);
    await fetch(`/api/v1/comments/${id}`, { method: "DELETE" });
    setDeletingId(null);
    await Promise.all([loadComments(filter), loadCounts()]);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              filter === tab ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100" : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}>
            {tab}
            {counts[tab] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                tab === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-400">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No {filter === "all" ? "" : filter} comments.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Author</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Comment</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Post</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Date</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{comment.authorName}</p>
                    <p className="text-xs text-neutral-400">{comment.authorEmail}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 text-neutral-700 dark:text-neutral-300">{comment.content}</p>
                    {comment.editedAt && <p className="text-xs text-neutral-400 mt-0.5">edited</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-[160px]">
                    <p className="truncate text-xs">{comment.postTitle ?? comment.postId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[comment.status] ?? ""}`}>
                      {comment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{new Date(comment.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {comment.status !== "approved" && (
                        <button onClick={() => updateStatus(comment.id, "approved")} className="text-xs text-green-600 hover:text-green-800">Approve</button>
                      )}
                      {comment.status !== "spam" && (
                        <button onClick={() => updateStatus(comment.id, "spam")} className="text-xs text-red-500 hover:text-red-700">Spam</button>
                      )}
                      {comment.status !== "trash" && (
                        <button onClick={() => updateStatus(comment.id, "trash")} className="text-xs text-neutral-500 hover:text-neutral-700">Trash</button>
                      )}
                      <button
                        onClick={() => deleteComment(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-xs text-red-700 hover:text-red-900 font-medium disabled:opacity-50"
                      >
                        {deletingId === comment.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
