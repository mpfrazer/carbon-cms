"use client";

import { Star } from "lucide-react";
import type { AdminEditorProps } from "@/templates/registry";

interface BookReviewData {
  author: string;
  rating: number;
  yearPublished?: number;
  genre?: string;
  pageCount?: number;
  isbn?: string;
  purchaseUrl?: string;
}

const GENRE_OPTIONS: { value: string; label: string }[] = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-fiction" },
  { value: "biography", label: "Biography" },
  { value: "sci-fi", label: "Sci-fi" },
  { value: "fantasy", label: "Fantasy" },
  { value: "mystery", label: "Mystery" },
  { value: "poetry", label: "Poetry" },
  { value: "essays", label: "Essays" },
  { value: "other", label: "Other" },
];

function defaults(): BookReviewData {
  return { author: "", rating: 0 };
}

export function coerce(value: Record<string, unknown>): BookReviewData {
  const d = defaults();
  const v = value as Partial<BookReviewData>;
  return {
    author: typeof v.author === "string" ? v.author : d.author,
    rating: typeof v.rating === "number" ? v.rating : d.rating,
    yearPublished: typeof v.yearPublished === "number" ? v.yearPublished : undefined,
    genre: typeof v.genre === "string" ? v.genre : undefined,
    pageCount: typeof v.pageCount === "number" ? v.pageCount : undefined,
    isbn: typeof v.isbn === "string" ? v.isbn : undefined,
    purchaseUrl: typeof v.purchaseUrl === "string" ? v.purchaseUrl : undefined,
  };
}

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

function StarPicker({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className="rounded p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <Star
            className={`h-5 w-5 ${
              n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-600"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-xs text-neutral-500">
        {value > 0 ? `${value} of 5` : "Not rated"}
      </span>
    </div>
  );
}

export function BookReviewEditor({ value, onChange }: AdminEditorProps) {
  const data = coerce(value);

  function update<K extends keyof BookReviewData>(key: K, next: BookReviewData[K]) {
    const merged: Record<string, unknown> = { ...data, [key]: next };
    // Drop undefined keys so the API doesn't receive explicit nulls for
    // optional fields — keeps the JSON payload tight and matches the
    // schema's "optional means absent" semantics.
    for (const k of Object.keys(merged)) {
      if (merged[k] === undefined || merged[k] === "") delete merged[k];
    }
    onChange(merged);
  }

  return (
    <div className="space-y-4 rounded-md border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Author</label>
          <input
            type="text"
            value={data.author}
            onChange={(e) => update("author", e.target.value)}
            placeholder="Octavia E. Butler"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Rating</label>
          <StarPicker value={data.rating} onChange={(n) => update("rating", n)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Genre <span className="text-neutral-400">(optional)</span></label>
          <select
            value={data.genre ?? ""}
            onChange={(e) => update("genre", e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">—</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Year <span className="text-neutral-400">(optional)</span></label>
          <input
            type="number"
            min={1}
            max={9999}
            value={data.yearPublished ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              update("yearPublished", Number.isNaN(n) ? undefined : n);
            }}
            placeholder="1993"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Pages <span className="text-neutral-400">(optional)</span></label>
          <input
            type="number"
            min={1}
            value={data.pageCount ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              update("pageCount", Number.isNaN(n) ? undefined : n);
            }}
            placeholder="299"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">ISBN <span className="text-neutral-400">(optional)</span></label>
          <input
            type="text"
            value={data.isbn ?? ""}
            onChange={(e) => update("isbn", e.target.value || undefined)}
            placeholder="9780446675505"
            className={inputClass + " font-mono"}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Purchase URL <span className="text-neutral-400">(optional)</span></label>
          <input
            type="url"
            value={data.purchaseUrl ?? ""}
            onChange={(e) => update("purchaseUrl", e.target.value || undefined)}
            placeholder="https://example.com/book"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
