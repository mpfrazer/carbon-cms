"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link as LinkIcon, Unlink,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Heading1, Heading2, Heading3, Minus, Sparkles, ChevronDown,
  ImageIcon, Upload, X,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const IMPROVE_ACTIONS = [
  { key: "improve", label: "Improve writing" },
  { key: "shorten", label: "Make shorter" },
  { key: "lengthen", label: "Expand" },
  { key: "grammar", label: "Fix grammar" },
  { key: "tone-professional", label: "Professional tone" },
  { key: "tone-casual", label: "Casual tone" },
  { key: "tone-friendly", label: "Friendly tone" },
  { key: "tone-authoritative", label: "Authoritative tone" },
] as const;

type ImproveAction = typeof IMPROVE_ACTIONS[number]["key"];

interface MediaItem {
  id: string;
  url: string;
  originalFilename: string;
  mimeType: string;
  altText?: string | null;
}

function ImagePickerModal({ onInsert, onClose }: { onInsert: (url: string, alt: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/v1/media?pageSize=100");
    const json = await res.json();
    setItems((json.data ?? []).filter((m: MediaItem) => m.mimeType.startsWith("image/")));
    setLoading(false);
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/v1/media", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) {
      setUploadError(json.error ?? "Upload failed");
      setUploading(false);
      return;
    }
    await loadImages();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onInsert(json.data.url, json.data.altText ?? json.data.originalFilename);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative flex h-[70vh] w-[720px] max-w-[95vw] flex-col rounded-lg bg-white dark:bg-neutral-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Insert image</h2>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
            >
              <Upload className="h-3 w-3" />
              {uploading ? "Uploading…" : "Upload new"}
            </button>
            <button type="button" onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {uploadError && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{uploadError}</div>
          )}
          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No images uploaded yet. Upload one above.</div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onInsert(item.url, item.altText ?? item.originalFilename)}
                  className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-400 transition-colors"
                  title={item.originalFilename}
                >
                  <img src={item.url} alt={item.altText ?? item.originalFilename} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RichEditor({ value, onChange, placeholder = "Write your content here…" }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "underline text-blue-600" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ HTMLAttributes: { class: "max-w-full rounded" } }),
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-neutral max-w-none min-h-[20rem] focus:outline-none px-4 py-3",
      },
    },
  });

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  function setLink() {
    const prev = editor!.getAttributes("link").href ?? "";
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") { editor!.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function insertImage(url: string, alt: string) {
    editor!.chain().focus().setImage({ src: url, alt }).run();
    setImagePickerOpen(false);
  }

  async function runImprove(action: ImproveAction) {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const fullText = editor.getText();
    const context = fullText.slice(Math.max(0, from - 200), from).trim();

    setAiOpen(false);
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/v1/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "improve",
          ctx: { action, selectedText, context },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiError(json.error ?? "AI request failed");
        return;
      }
      const improved: string = json.result?.trim() ?? "";
      if (improved) {
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, improved).run();
      }
    } catch {
      setAiError("Network error");
    } finally {
      setAiLoading(false);
    }
  }

  const btn = (active: boolean) =>
    `rounded p-1.5 transition-colors ${active ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100"}`;

  const sep = <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-600 mx-0.5" />;

  const hasSelection = !editor.state.selection.empty;

  return (
    <>
      {imagePickerOpen && <ImagePickerModal onInsert={insertImage} onClose={() => setImagePickerOpen(false)} />}

      <div className="rounded-md border border-neutral-300 dark:border-neutral-600 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 dark:border-neutral-700 px-2 py-1.5">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false)} title="Undo"><Undo2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false)} title="Redo"><Redo2 className="h-4 w-4" /></button>
          {sep}
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="Heading 1"><Heading1 className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2"><Heading2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="Heading 3"><Heading3 className="h-4 w-4" /></button>
          {sep}
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic"><Italic className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Underline"><UnderlineIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
          {sep}
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet list"><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Ordered list"><ListOrdered className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Blockquote"><Quote className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btn(editor.isActive("codeBlock"))} title="Code block"><Code className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Divider"><Minus className="h-4 w-4" /></button>
          {sep}
          <button type="button" onClick={setLink} className={btn(editor.isActive("link"))} title="Add link"><LinkIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")} className={btn(false)} title="Remove link"><Unlink className="h-4 w-4" /></button>
          {sep}
          <button type="button" onClick={() => setImagePickerOpen(true)} className={btn(false)} title="Insert image"><ImageIcon className="h-4 w-4" /></button>
          {sep}
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))} title="Align left"><AlignLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))} title="Align center"><AlignCenter className="h-4 w-4" /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btn(editor.isActive({ textAlign: "right" }))} title="Align right"><AlignRight className="h-4 w-4" /></button>
          {sep}

          {/* AI Improve dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setAiOpen((o) => !o)}
              disabled={aiLoading || !hasSelection}
              title={hasSelection ? "AI: improve selected text" : "Select text to use AI tools"}
              className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                hasSelection
                  ? "text-violet-600 hover:bg-violet-50"
                  : "text-neutral-300 cursor-not-allowed"
              } ${aiLoading ? "opacity-50" : ""}`}
            >
              {aiLoading ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI
              <ChevronDown className="h-3 w-3" />
            </button>

            {aiOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg">
                {IMPROVE_ACTIONS.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => runImprove(action.key)}
                    className="w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-900 dark:hover:text-violet-300 first:rounded-t-md last:rounded-b-md transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {aiError && (
          <div className="border-b border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs text-red-600 dark:text-red-400">
            {aiError}
          </div>
        )}

        {/* Editor area */}
        <EditorContent editor={editor} />
      </div>
    </>
  );
}
