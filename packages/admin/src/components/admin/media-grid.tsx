"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import Image from "next/image";

interface MediaItem {
  id: string;
  url: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  altText?: string | null;
  createdAt: Date;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaGrid() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadMedia() {
    setLoading(true);
    const res = await fetch("/api/v1/media?pageSize=50");
    const json = await res.json();
    setItems(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadMedia(); }, []);

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
    } else {
      loadMedia();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/v1/media/${id}`, { method: "DELETE" });
    loadMedia();
  }

  return (
    <div className="p-6">
      {uploadError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{uploadError}</div>
      )}
      <div className="mb-4 flex justify-end">
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-neutral-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <p className="text-sm">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-lg border border-neutral-200 bg-white overflow-hidden">
              {item.mimeType.startsWith("image/") ? (
                <div className="relative aspect-square bg-neutral-100">
                  <Image src={item.url} alt={item.altText ?? item.originalFilename} fill className="object-cover" sizes="200px" />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-neutral-100 text-xs text-neutral-500 font-mono uppercase p-2">
                  {item.mimeType.split("/")[1]}
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs text-neutral-700">{item.originalFilename}</p>
                <p className="text-xs text-neutral-400">{formatSize(item.size)}</p>
              </div>
              <button onClick={() => handleDelete(item.id)}
                className="absolute right-2 top-2 hidden rounded bg-white/90 p-1 shadow group-hover:flex hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
