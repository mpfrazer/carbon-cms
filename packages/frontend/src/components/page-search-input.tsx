"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchInputMode } from "@/lib/site-settings";

interface PageSearchInputProps {
  initialQ: string;
  inputMode: SearchInputMode;
}

export function PageSearchInput({ initialQ, inputMode }: PageSearchInputProps) {
  const [query, setQuery] = useState(initialQ);
  const router = useRouter();

  useEffect(() => {
    if (inputMode !== "instant" || !query.trim()) return;
    const t = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
    }, 350);
    return () => clearTimeout(t);
  }, [query, inputMode, router]);

  const inputClass =
    "w-full rounded-lg border border-neutral-300 pl-10 pr-4 py-3 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  if (inputMode === "submit") {
    return (
      <form action="/search" method="get" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
        <input
          name="q"
          type="search"
          defaultValue={initialQ}
          placeholder="Search posts and pages…"
          className={inputClass}
          autoComplete="off"
          autoFocus
        />
      </form>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts and pages…"
        className={inputClass}
        autoComplete="off"
        autoFocus
      />
    </div>
  );
}
