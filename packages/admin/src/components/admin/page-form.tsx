"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, FileText } from "lucide-react";
import { RichEditor } from "@/components/admin/rich-editor";
import { BlockEditor, type PageBlock } from "@/components/admin/block-editor";
import { RevisionPanel } from "@/components/admin/revision-panel";

interface PageItem { id: string; title: string; }

interface PageFormProps {
  page?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    blocks?: string | null;
    status: string;
    parentId?: string | null;
    menuOrder?: number | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
  allPages: PageItem[];
}

export function PageForm({ page, allPages }: PageFormProps) {
  const router = useRouter();
  const isEditing = !!page;

  // Determine initial editor mode: block-based if blocks JSON exists, otherwise rich text
  const initialBlocks: PageBlock[] | null = (() => {
    if (!page?.blocks) return null;
    try {
      const parsed = JSON.parse(page.blocks);
      return Array.isArray(parsed) ? parsed : null;
    } catch { return null; }
  })();

  const [editorMode, setEditorMode] = useState<"richtext" | "blocks">(initialBlocks ? "blocks" : "richtext");
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks ?? []);

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [content, setContent] = useState(page?.content ?? "");
  const [status, setStatus] = useState(page?.status ?? "draft");
  const [parentId, setParentId] = useState(page?.parentId ?? "");
  const [menuOrder, setMenuOrder] = useState(String(page?.menuOrder ?? 0));
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(page?.metaDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const parentOptions = allPages.filter((p) => p.id !== page?.id);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) {
      setSlug(val.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  }

  function switchToBlocks() {
    // Migrate existing rich-text content to a single text block
    if (editorMode === "richtext" && content) {
      setBlocks([{ type: "text", content }]);
    } else if (editorMode === "richtext") {
      setBlocks([]);
    }
    setEditorMode("blocks");
  }

  function switchToRichText() {
    setEditorMode("richtext");
    // Preserve blocks data but don't send it
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body: Record<string, unknown> = {
      title, slug, status,
      parentId: parentId || null,
      menuOrder: parseInt(menuOrder, 10) || 0,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    };

    if (editorMode === "blocks") {
      body.blocks = JSON.stringify(blocks);
      // content derived server-side from blocks
    } else {
      body.content = content;
      body.blocks = null; // clear blocks if switching back to rich text
    }

    const res = await fetch(isEditing ? `/api/v1/pages/${page.id}` : "/api/v1/pages", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong"); setSaving(false); return; }

    router.push("/admin/pages");
    router.refresh();
  }

  async function handlePreview() {
    if (!page) return;
    setPreviewing(true);
    try {
      const res = await fetch(`/api/v1/pages/${page.id}/preview`);
      const json = await res.json();
      if (res.ok && json.data?.previewUrl) {
        window.open(json.data.previewUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDelete() {
    if (!page || !confirm("Delete this page? This cannot be undone.")) return;
    await fetch(`/api/v1/pages/${page.id}`, { method: "DELETE" });
    router.push("/admin/pages");
    router.refresh();
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-3xl">
      {error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Title</label>
        <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} required className={inputClass} placeholder="Page title" />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Slug</label>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputClass + " font-mono"} />
      </div>

      {/* Editor mode toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-neutral-700">Content</label>
          <div className="flex rounded-md border border-neutral-200 overflow-hidden text-xs font-medium">
            <button
              type="button"
              onClick={switchToRichText}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${editorMode === "richtext" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
            >
              <FileText className="h-3.5 w-3.5" /> Rich text
            </button>
            <button
              type="button"
              onClick={switchToBlocks}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-neutral-200 transition-colors ${editorMode === "blocks" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
            >
              <LayoutTemplate className="h-3.5 w-3.5" /> Page builder
            </button>
          </div>
        </div>

        {editorMode === "richtext" ? (
          <RichEditor value={content} onChange={setContent} />
        ) : (
          <BlockEditor value={blocks} onChange={setBlocks} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Menu order</label>
          <input type="number" value={menuOrder} onChange={(e) => setMenuOrder(e.target.value)} min={0} className={inputClass} />
        </div>

        {parentOptions.length > 0 && (
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Parent page</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
              <option value="">None (top-level)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <details className="rounded-md border border-neutral-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700">SEO</summary>
        <div className="mt-4 space-y-4">
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
          contentType="pages"
          contentId={page.id}
          onRestored={() => window.location.reload()}
        />
      )}

      <div className="flex items-center justify-between pt-2">
        {isEditing ? (
          <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800 transition-colors">Delete page</button>
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
          <button type="submit" disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create page"}
          </button>
        </div>
      </div>
    </form>
  );
}
