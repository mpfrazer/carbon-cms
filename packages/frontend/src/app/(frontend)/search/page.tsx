import { apiGet } from "@/lib/api/client";
import { getSiteSettings } from "@/lib/site-settings";
import { getThemeComponents } from "@/lib/theme-provider";
import type { SearchResult } from "@/lib/theme-provider";

interface SearchResponse {
  data: SearchResult[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [{ SearchPage: SearchPageComponent }, settings, searchRes] = await Promise.all([
    getThemeComponents(),
    getSiteSettings(),
    query
      ? (apiGet(`/api/v1/search?q=${encodeURIComponent(query)}&pageSize=20`) as Promise<SearchResponse>).catch(() => null)
      : Promise.resolve(null),
  ]);

  const results = searchRes?.data ?? [];
  const total = searchRes?.meta.total ?? 0;

  return (
    <SearchPageComponent
      query={query}
      results={results}
      total={total}
      inputMode={settings.searchInputMode}
    />
  );
}
