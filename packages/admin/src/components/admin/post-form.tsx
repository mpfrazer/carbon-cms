"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { RichEditor } from "@/components/admin/rich-editor";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import { ExcerptGenerator } from "@/components/admin/ai/excerpt-generator";
import { SeoOptimizer } from "@/components/admin/ai/seo-optimizer";
import { TagSuggester } from "@/components/admin/ai/tag-suggester";
import { CategorySuggester } from "@/components/admin/ai/category-suggester";
import { TitleSuggester } from "@/components/admin/ai/title-suggester";
import { OutlineGenerator } from "@/components/admin/ai/outline-generator";
import { RevisionPanel } from "@/components/admin/revision-panel";

interface Taxonomy { id: string; name: string; }

function FeaturedImagePicker({
  value,
  previewUrl,
  onChange,
}: {
  value: string | null;
  previewUrl: string | null;
  onChange: (id: string | null, url: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative rounded-md overflow-hidden border border-neutral-200 bg-neutral-50">
          <img src={previewUrl} alt="Featured image" className="w-full object-cover max-h-64" />
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-neutral-600 hover:text-red-500 shadow transition-colors"
            title="Remove featured image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-200 py-8 text-sm text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 transition-colors"
        >
          <ImageIcon className="h-4 w-4" />
          Choose featured image
        </button>
      )}
      {previewUrl && (
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-neutral-500 hover:text-neutral-800 underline underline-offset-2 transition-colors">
          Change image
        </button>
      )}

      <MediaPickerModal
        title="Choose featured image"
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(item) => onChange(item.id, item.url)}
        selectedId={value}
      />
    </div>
  );
}

interface PostFormProps {
  post?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    status: string;
    reviewNote?: string | null;
    featuredImageId?: string | null;
    featuredImageUrl?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    categories?: Taxonomy[];
    tags?: Taxonomy[];
  };
  allCategories: Taxonomy[];
  allTags: Taxonomy[];
  userRole?: string;
}

export function PostForm({ post, allCategories, allTags, userRole = "author" }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;
  const isReviewer = userRole === "admin" || userRole === "editor";

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(post?.featuredImageId ?? null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(post?.featuredImageUrl ?? null);
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    post?.categories?.map((c) => c.id) ?? []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map((t) => t.id) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [approvingOrRejecting, setApprovingOrRejecting] = useState(false);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) {
      setSlug(val.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  async function handleSubmitForReview() {
    if (!post) return;
    setSubmittingReview(true);
    setError(null);
    const res = await fetch(`/api/v1/posts/${post.id}/submit-review`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to submit for review"); setSubmittingReview(false); return; }
    router.refresh();
    window.location.reload();
  }

  async function handleApprove() {
    if (!post || !confirm("Approve and publish this post?")) return;
    setApprovingOrRejecting(true);
    setError(null);
    const res = await fetch(`/api/v1/posts/${post.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: reviewNote || undefined }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to approve"); setApprovingOrRejecting(false); return; }
    router.push("/admin/posts");
    router.refresh();
  }

  async function handleReject() {
    if (!post) return;
    if (!reviewNote.trim()) { setError("A note is required when rejecting a post."); return; }
    if (!confirm("Reject this post and return it to draft?")) return;
    setApprovingOrRejecting(true);
    setError(null);
    const res = await fetch(`/api/v1/posts/${post.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: reviewNote }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to reject"); setApprovingOrRejecting(false); return; }
    router.push("/admin/posts");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body = {
      title, slug, content,
      excerpt: excerpt || null,
      status,
      featuredImageId: featuredImageId ?? null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
    };

    const res = await fetch(isEditing ? `/api/v1/posts/${post.id}` : "/api/v1/posts", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong"); setSaving(false); return; }

    router.push("/admin/posts");
    router.refresh();
  }

  async function handlePreview() {
    if (!post) return;
    setPreviewing(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}/preview`);
      const json = await res.json();
      if (res.ok && json.data?.previewUrl) {
        window.open(json.data.previewUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDelete() {
    if (!post || !confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
    router.push("/admin/posts");
    router.refresh();
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-3xl">
      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Review workflow banner */}
      {isEditing && status === "in_review" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Awaiting review</span>
          </div>
          {post.reviewNote && (
            <p className="text-sm text-amber-700 italic">&ldquo;{post.reviewNote}&rdquo;</p>
          )}
          {isReviewer && (
            <div className="space-y-2 pt-1">
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note (required when rejecting)…"
                rows={2}
                className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={approvingOrRejecting}
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {approvingOrRejecting ? "Working…" : "Approve & publish"}
                </button>
                <button
                  type="button"
                  disabled={approvingOrRejecting}
                  onClick={handleReject}
                  className="flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {approvingOrRejecting ? "Working…" : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prior review note shown after rejection */}
      {isEditing && status === "draft" && post.reviewNote && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-xs font-medium text-neutral-500 mb-1">Reviewer note</p>
          <p className="text-sm text-neutral-700 italic">&ldquo;{post.reviewNote}&rdquo;</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Title</label>
        <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} required className={inputClass} placeholder="Post title" />
        <TitleSuggester currentTitle={title} content={content} onSelected={handleTitleChange} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Slug</label>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputClass + " font-mono"} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Content</label>
        {!content && (
          <OutlineGenerator title={title} onGenerated={setContent} />
        )}
        <RichEditor value={content} onChange={setContent} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Featured image</label>
        <FeaturedImagePicker
          value={featuredImageId}
          previewUrl={featuredImageUrl}
          onChange={(id, url) => { setFeaturedImageId(id); setFeaturedImageUrl(url); }}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-neutral-700">Excerpt</label>
          <ExcerptGenerator title={title} content={content} onGenerated={setExcerpt} />
        </div>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} className={inputClass} placeholder="Optional short summary" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Categories */}
        {allCategories.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">Categories</label>
              <CategorySuggester
                title={title}
                content={content}
                allCategories={allCategories}
                selectedCategoryIds={selectedCategories}
                onSelected={setSelectedCategories}
              />
            </div>
            <div className="rounded-md border border-neutral-200 divide-y divide-neutral-100 max-h-48 overflow-y-auto">
              {allCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                  <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={() => toggleCategory(cat.id)}
                    className="h-4 w-4 rounded border-neutral-300" />
                  <span className="text-sm text-neutral-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-700">Tags</label>
              <TagSuggester
                title={title}
                content={content}
                existingTags={allTags}
                selectedTagIds={selectedTags}
                onSelected={setSelectedTags}
              />
            </div>
            <div className="rounded-md border border-neutral-200 max-h-48 overflow-y-auto p-2 flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const selected = selectedTags.includes(tag.id);
                return (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}>
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <details className="rounded-md border border-neutral-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700">SEO</summary>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500">Auto-generate meta title and description</span>
            <SeoOptimizer
              title={title}
              content={content}
              currentMetaTitle={metaTitle}
              currentMetaDescription={metaDescription}
              onGenerated={(mt, md) => { setMetaTitle(mt); setMetaDescription(md); }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Meta title</label>
            <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Meta description</label>
            <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={inputClass} />
          </div>
        </div>
      </details>

      {isEditing && (
        <RevisionPanel
          contentType="posts"
          contentId={post.id}
          onRestored={() => window.location.reload()}
        />
      )}

      <div className="flex items-center justify-between pt-2">
        {isEditing ? (
          <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800 transition-colors">Delete post</button>
        ) : <span />}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">Cancel</button>
          {isEditing && (
            <button type="button" onClick={handlePreview} disabled={previewing}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors">
              {previewing ? "Opening…" : "Preview"}
            </button>
          )}
          {isEditing && status === "draft" && !isReviewer && (
            <button
              type="button"
              disabled={submittingReview}
              onClick={handleSubmitForReview}
              className="rounded-md border border-neutral-400 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              {submittingReview ? "Submitting…" : "Submit for review"}
            </button>
          )}
          {status !== "in_review" && (
            <button type="submit" disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : isEditing ? "Save changes" : "Create post"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
