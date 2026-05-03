"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface MediaItem {
  id: string;
  url: string;
  altText: string | null;
  mimeType: string;
}

interface MediaPickerModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  selectedId?: string | null;
}

export function MediaPickerModal({ title, open, onClose, onSelect, selectedId }: MediaPickerModalProps) {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/v1/media?pageSize=100")
      .then((r) => r.json())
      .then((j) => setImages((j.data ?? []).filter((m: MediaItem) => m.mimeType.startsWith("image/"))));

    function onClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, onClose]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/v1/media", { method: "POST", body: form });
    const json = await res.json();
    if (res.ok) {
      onSelect(json.data as MediaItem);
      onClose();
    }
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = "";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={modalRef} className="w-full max-w-2xl rounded-xl bg-white dark:bg-neutral-800 shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 px-5 py-4">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              disabled={uploading}
              className="rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading…" : "Upload new"}
            </button>
            <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 grid grid-cols-3 gap-3">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => { onSelect(img); onClose(); }}
              className={`rounded-md overflow-hidden border-2 transition-colors ${selectedId === img.id ? "border-neutral-900" : "border-transparent hover:border-neutral-300"}`}
            >
              <img src={img.url} alt={img.altText ?? ""} loading="lazy" className="w-full h-32 object-cover" />
            </button>
          ))}
          {images.length === 0 && !uploading && (
            <p className="col-span-3 py-8 text-center text-sm text-neutral-400">No images in library yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
