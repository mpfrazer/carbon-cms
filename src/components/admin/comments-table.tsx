"use client";

import { useEffect, useState } from "react";

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  spam: "bg-red-100 text-red-700",
  trash: "bg-neutral-100 text-neutral-600",
};

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  createdAt: Date;
}

export function CommentsTable() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  async function loadComments(status: string) {
    setLoading(true);
    const res = await fetch(`/api/v1/comments?status=${status}&pageSize=50`);
    const json = await res.json();
    setComments(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadComments(filter); }, [filter]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/v1/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadComments(filter);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-1 border-b border-neutral-200">
        {["pending", "approved", "spam", "trash"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              filter === s ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-400">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No {filter} comments.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Author</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Comment</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{comment.authorName}</p>
                    <p className="text-xs text-neutral-400">{comment.authorEmail}</p>
                  </td>
                  <td className="px-4 py-3 max-w-sm">
                    <p className="line-clamp-2 text-neutral-700">{comment.content}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[comment.status] ?? ""}`}>
                      {comment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(comment.createdAt).toLocaleDateString()}</td>
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
