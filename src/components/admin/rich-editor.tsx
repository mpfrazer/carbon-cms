"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExt from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Link as LinkIcon, Unlink,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Heading1, Heading2, Heading3, Minus, Sparkles, ChevronDown,
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

export function RichEditor({ value, onChange, placeholder = "Write your content here…" }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "underline text-blue-600" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
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
    `rounded p-1.5 transition-colors ${active ? "bg-neutral-200 text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`;

  const sep = <div className="w-px h-5 bg-neutral-200 mx-0.5" />;

  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="rounded-md border border-neutral-300 focus-within:border-neutral-500 focus-within:ring-1 focus-within:ring-neutral-500">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 px-2 py-1.5">
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
            <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-neutral-200 bg-white shadow-lg">
              {IMPROVE_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => runImprove(action.key)}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-violet-50 hover:text-violet-900 first:rounded-t-md last:rounded-b-md transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {aiError && (
        <div className="border-b border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-600">
          {aiError}
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
