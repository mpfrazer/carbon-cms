"use client";

import { useState } from "react";
import Link from "next/link";

export interface Comment {
  id: string;
  postId: string;
  userId: string | null;
  authorName: string;
  content: string;
  status: string;
  parentId: string | null;
  editedAt: string | null;
  createdAt: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

interface Props {
  postId: string;
  initialComments: Comment[];
  allowComments: boolean;
  requireLoginToComment: boolean;
  currentUser: CurrentUser | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function CommentsSection({ postId, initialComments, allowComments, requireLoginToComment, currentUser }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  async function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/v1/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setEditError(json.error ?? "Failed to save");
        return;
      }
      const { data: updated } = await res.json() as { data: Comment };
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
    } catch {
      setEditError("Network error");
    } finally {
      setEditSaving(false);
    }
  }

  function onNewComment(comment: Comment) {
    setComments((prev) => [...prev, comment]);
  }

  return (
    <section className="mt-12 border-t border-neutral-200 pt-10">
      <h2 className="text-xl font-semibold text-neutral-900 mb-8">
        {comments.length === 0 ? "Comments" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
      </h2>

      {comments.length > 0 && (
        <ul className="space-y-6 mb-10">
          {comments.map((comment) => {
            const isOwner = !!(currentUser && comment.userId === currentUser.id);
            const isEditing = editingId === comment.id;
            return (
              <li key={comment.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-neutral-900">{comment.authorName}</span>
                  <span className="text-neutral-400">·</span>
                  <time className="text-neutral-400">{formatDate(comment.createdAt)}</time>
                  {comment.editedAt && <span className="text-neutral-400 text-xs">(edited)</span>}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 resize-y"
                    />
                    {editError && <p className="text-sm text-red-600">{editError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(comment.id)}
                        disabled={editSaving || !editContent.trim()}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                      >
                        {editSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{comment.content}</p>
                    {isOwner && (
                      <button
                        onClick={() => startEdit(comment)}
                        className="shrink-0 text-xs text-neutral-400 hover:text-neutral-700 transition-colors underline underline-offset-2"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {allowComments && (
        <CommentForm
          postId={postId}
          requireLoginToComment={requireLoginToComment}
          currentUser={currentUser}
          onSuccess={onNewComment}
        />
      )}
    </section>
  );
}

interface CommentFormProps {
  postId: string;
  requireLoginToComment: boolean;
  currentUser: CurrentUser | null;
  onSuccess: (comment: Comment) => void;
}

function CommentForm({ postId, requireLoginToComment, currentUser, onSuccess }: CommentFormProps) {
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (requireLoginToComment && !currentUser) {
    return (
      <p className="text-sm text-neutral-500">
        <Link href="/login" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600">
          Sign in
        </Link>{" "}
        to leave a comment.
      </p>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm text-neutral-600 rounded-md bg-neutral-50 border border-neutral-200 px-4 py-3">
        Your comment has been submitted and is awaiting moderation.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, authorName: name.trim(), authorEmail: email.trim(), content }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to submit comment");
        return;
      }
      const { data: comment } = await res.json() as { data: Comment };
      if (comment.status === "approved") {
        onSuccess(comment);
        setContent("");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-medium text-neutral-900">Leave a comment</h3>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!currentUser && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="comment-name" className="block text-sm font-medium text-neutral-700">Name</label>
            <input
              id="comment-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="comment-email" className="block text-sm font-medium text-neutral-700">Email</label>
            <input
              id="comment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="you@example.com"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="comment-content" className="block text-sm font-medium text-neutral-700">Comment</label>
        <textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 resize-y"
          placeholder="Share your thoughts…"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting…" : "Post comment"}
      </button>
    </form>
  );
}
