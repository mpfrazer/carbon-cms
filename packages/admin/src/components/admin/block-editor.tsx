"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, Type, Image as ImageIcon, Columns, Megaphone, LayoutTemplate } from "lucide-react";
import { RichEditor } from "@/components/admin/rich-editor";

export type TextBlock = { type: "text"; content: string };
export type HeroBlock = { type: "hero"; heading: string; subheading?: string; ctaText?: string; ctaUrl?: string; backgroundImageUrl?: string };
export type ImageBlock = { type: "image"; url: string; alt?: string; caption?: string; fullWidth?: boolean };
export type ColumnsBlock = { type: "columns"; columns: { content: string }[] };
export type CtaBlock = { type: "cta"; heading: string; body?: string; buttonText: string; buttonUrl: string };
export type PageBlock = TextBlock | HeroBlock | ImageBlock | ColumnsBlock | CtaBlock;

const BLOCK_TYPES: { type: PageBlock["type"]; label: string; icon: React.ReactNode; description: string }[] = [
  { type: "text", label: "Text", icon: <Type className="h-5 w-5" />, description: "Rich text content" },
  { type: "hero", label: "Hero", icon: <LayoutTemplate className="h-5 w-5" />, description: "Large heading with optional CTA" },
  { type: "image", label: "Image", icon: <ImageIcon className="h-5 w-5" />, description: "Full-width or contained image" },
  { type: "columns", label: "Columns", icon: <Columns className="h-5 w-5" />, description: "2 or 3 column layout" },
  { type: "cta", label: "Call to Action", icon: <Megaphone className="h-5 w-5" />, description: "Heading, body, and button" },
];

function defaultBlock(type: PageBlock["type"]): PageBlock {
  switch (type) {
    case "text": return { type: "text", content: "" };
    case "hero": return { type: "hero", heading: "" };
    case "image": return { type: "image", url: "" };
    case "columns": return { type: "columns", columns: [{ content: "" }, { content: "" }] };
    case "cta": return { type: "cta", heading: "", buttonText: "Learn more", buttonUrl: "/" };
  }
}

// ---- Individual block edit forms ----

function TextBlockForm({ block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void }) {
  return (
    <RichEditor value={block.content} onChange={(v) => onChange({ ...block, content: v })} />
  );
}

function HeroBlockForm({ block, onChange }: { block: HeroBlock; onChange: (b: HeroBlock) => void }) {
  const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Heading *</label>
        <input type="text" value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} placeholder="Page hero heading" className={input} />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Subheading</label>
        <input type="text" value={block.subheading ?? ""} onChange={(e) => onChange({ ...block, subheading: e.target.value || undefined })} placeholder="Optional subheading" className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">CTA button text</label>
          <input type="text" value={block.ctaText ?? ""} onChange={(e) => onChange({ ...block, ctaText: e.target.value || undefined })} placeholder="Get started" className={input} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">CTA URL</label>
          <input type="text" value={block.ctaUrl ?? ""} onChange={(e) => onChange({ ...block, ctaUrl: e.target.value || undefined })} placeholder="/contact" className={input} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Background image URL</label>
        <input type="url" value={block.backgroundImageUrl ?? ""} onChange={(e) => onChange({ ...block, backgroundImageUrl: e.target.value || undefined })} placeholder="https://…" className={input} />
      </div>
    </div>
  );
}

function ImageBlockForm({ block, onChange }: { block: ImageBlock; onChange: (b: ImageBlock) => void }) {
  const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Image URL *</label>
        <input type="url" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://…" className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Alt text</label>
          <input type="text" value={block.alt ?? ""} onChange={(e) => onChange({ ...block, alt: e.target.value || undefined })} className={input} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Caption</label>
          <input type="text" value={block.caption ?? ""} onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })} className={input} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
        <input type="checkbox" checked={block.fullWidth ?? false} onChange={(e) => onChange({ ...block, fullWidth: e.target.checked })} className="h-4 w-4 rounded border-neutral-300" />
        Full width (edge-to-edge)
      </label>
    </div>
  );
}

function ColumnsBlockForm({ block, onChange }: { block: ColumnsBlock; onChange: (b: ColumnsBlock) => void }) {
  function updateCol(i: number, content: string) {
    const cols = block.columns.map((c, idx) => idx === i ? { content } : c);
    onChange({ ...block, columns: cols });
  }
  function setCount(n: 2 | 3) {
    const cols = Array.from({ length: n }, (_, i) => block.columns[i] ?? { content: "" });
    onChange({ ...block, columns: cols });
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-neutral-600">Columns:</span>
        {([2, 3] as const).map((n) => (
          <button key={n} type="button" onClick={() => setCount(n)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${block.columns.length === n ? "bg-neutral-900 text-white" : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className={`grid gap-4 ${block.columns.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {block.columns.map((col, i) => (
          <div key={i}>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Column {i + 1}</label>
            <RichEditor value={col.content} onChange={(v) => updateCol(i, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaBlockForm({ block, onChange }: { block: CtaBlock; onChange: (b: CtaBlock) => void }) {
  const input = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Heading *</label>
        <input type="text" value={block.heading} onChange={(e) => onChange({ ...block, heading: e.target.value })} className={input} />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1">Body text</label>
        <textarea value={block.body ?? ""} onChange={(e) => onChange({ ...block, body: e.target.value || undefined })} rows={2} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Button text *</label>
          <input type="text" value={block.buttonText} onChange={(e) => onChange({ ...block, buttonText: e.target.value })} className={input} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Button URL *</label>
          <input type="text" value={block.buttonUrl} onChange={(e) => onChange({ ...block, buttonUrl: e.target.value })} className={input} />
        </div>
      </div>
    </div>
  );
}

function BlockForm({ block, onChange }: { block: PageBlock; onChange: (b: PageBlock) => void }) {
  switch (block.type) {
    case "text": return <TextBlockForm block={block} onChange={onChange} />;
    case "hero": return <HeroBlockForm block={block} onChange={onChange} />;
    case "image": return <ImageBlockForm block={block} onChange={onChange} />;
    case "columns": return <ColumnsBlockForm block={block} onChange={onChange} />;
    case "cta": return <CtaBlockForm block={block} onChange={onChange} />;
  }
}

const BLOCK_LABELS: Record<PageBlock["type"], string> = {
  text: "Text",
  hero: "Hero",
  image: "Image",
  columns: "Columns",
  cta: "Call to Action",
};

// ---- Block picker modal ----

function BlockPicker({ onPick, onClose }: { onPick: (type: PageBlock["type"]) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-5">
        <p className="text-sm font-semibold text-neutral-800 mb-4">Add a block</p>
        <div className="space-y-2">
          {BLOCK_TYPES.map((bt) => (
            <button key={bt.type} type="button" onClick={() => { onPick(bt.type); onClose(); }}
              className="w-full flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 text-left hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
              <span className="text-neutral-400">{bt.icon}</span>
              <div>
                <p className="text-sm font-medium text-neutral-800">{bt.label}</p>
                <p className="text-xs text-neutral-400">{bt.description}</p>
              </div>
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-md border border-neutral-200 py-2 text-sm text-neutral-500 hover:bg-neutral-50 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ---- Main BlockEditor ----

interface BlockEditorProps {
  value: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  function addBlock(type: PageBlock["type"]) {
    onChange([...value, defaultBlock(type)]);
    // Expand the new block
    setCollapsed((prev) => { const s = new Set(prev); s.delete(value.length); return s; });
  }

  function updateBlock(i: number, block: PageBlock) {
    onChange(value.map((b, idx) => idx === i ? block : b));
  }

  function removeBlock(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
    setCollapsed((prev) => {
      const s = new Set<number>();
      prev.forEach((n) => { if (n < i) s.add(n); else if (n > i) s.add(n - 1); });
      return s;
    });
  }

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function toggleCollapse(i: number) {
    setCollapsed((prev) => {
      const s = new Set(prev);
      if (s.has(i)) s.delete(i); else s.add(i);
      return s;
    });
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
          No blocks yet. Add your first block below.
        </div>
      )}

      {value.map((block, i) => {
        const isCollapsed = collapsed.has(i);
        return (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            {/* Block header */}
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
              <button type="button" onClick={() => toggleCollapse(i)}
                className="flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
                <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-600">{BLOCK_LABELS[block.type]}</span>
                {isCollapsed && block.type === "text" && (
                  <span className="truncate max-w-xs text-neutral-400 font-normal">
                    {block.content.replace(/<[^>]+>/g, "").slice(0, 60) || "Empty"}
                  </span>
                )}
                {isCollapsed && block.type === "hero" && (
                  <span className="text-neutral-400 font-normal truncate max-w-xs">{block.heading || "No heading"}</span>
                )}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors" title="Move up">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === value.length - 1}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 transition-colors" title="Move down">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => removeBlock(i)}
                  className="rounded p-1 text-neutral-400 hover:text-red-600 transition-colors" title="Delete block">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Block body */}
            {!isCollapsed && (
              <div className="p-4">
                <BlockForm block={block} onChange={(b) => updateBlock(i, b)} />
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={() => setShowPicker(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 py-3 text-sm text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors">
        <Plus className="h-4 w-4" /> Add block
      </button>

      {showPicker && <BlockPicker onPick={addBlock} onClose={() => setShowPicker(false)} />}
    </div>
  );
}
