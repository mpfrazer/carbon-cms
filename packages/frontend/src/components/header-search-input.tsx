"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchInputMode } from "@/lib/site-settings";

interface SearchResult {
  type: "post" | "page";
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
}

interface HeaderSearchInputProps {
  inputMode: SearchInputMode;
  variant: "light" | "dark";
}

export function HeaderSearchInput({ inputMode, variant }: HeaderSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isLight = variant === "light";
  const inputClass = isLight
    ? "w-40 rounded-md border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:w-56 transition-all"
    : "w-40 rounded-md border border-white/20 bg-white/10 pl-8 pr-3 py-1.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/40 focus:w-56 transition-all";
  const iconClass = isLight ? "text-neutral-400" : "text-white/50";
  const dropdownClass = isLight
    ? "absolute right-0 top-full mt-1 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg z-50"
    : "absolute right-0 top-full mt-1 w-72 rounded-lg border border-white/20 bg-neutral-900 shadow-lg z-50";
  const itemClass = isLight
    ? "block px-4 py-2.5 hover:bg-neutral-50 transition-colors"
    : "block px-4 py-2.5 hover:bg-white/10 transition-colors";
  const titleClass = isLight ? "text-sm font-medium text-neutral-900" : "text-sm font-medium text-white";
  const metaClass = isLight ? "text-xs text-neutral-400 mt-0.5" : "text-xs text-white/40 mt-0.5";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (inputMode !== "instant" || !query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}&pageSize=5`);
        const json = await res.json();
        setResults(json.data ?? []);
        setOpen(true);
      } catch { /* ignore network errors */ }
    }, 300);
    return () => clearTimeout(t);
  }, [query, inputMode]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (inputMode === "submit") {
    return (
      <form action="/search" method="get" className="relative">
        <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${iconClass}`} />
        <input
          name="q"
          type="search"
          placeholder="Search…"
          className={inputClass}
          autoComplete="off"
        />
      </form>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${iconClass} pointer-events-none`} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search…"
        className={inputClass}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className={dropdownClass}>
          {results.map((r) => (
            <a
              key={r.id}
              href={r.url}
              className={itemClass}
              onClick={() => { setOpen(false); setQuery(""); }}
            >
              <p className={titleClass}>{r.title}</p>
              {r.excerpt && <p className={`${metaClass} line-clamp-1`}>{r.excerpt}</p>}
            </a>
          ))}
          <a
            href={`/search?q=${encodeURIComponent(query.trim())}`}
            className={`block px-4 py-2 text-xs border-t ${isLight ? "border-neutral-100 text-neutral-500 hover:bg-neutral-50" : "border-white/10 text-white/50 hover:bg-white/10"} transition-colors`}
            onClick={() => setOpen(false)}
          >
            See all results for &ldquo;{query}&rdquo;
          </a>
        </div>
      )}
      {open && results.length === 0 && query.trim() && (
        <div className={dropdownClass}>
          <p className={`px-4 py-3 text-sm ${isLight ? "text-neutral-400" : "text-white/40"}`}>No results found.</p>
        </div>
      )}
    </div>
  );
}
