import { apiGet } from "@/lib/api/client";
import { getSiteSettings } from "@/lib/site-settings";
import { PageSearchInput } from "@/components/page-search-input";
import { FileText, File } from "lucide-react";

interface SearchResult {
  type: "post" | "page";
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  url: string;
}

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

  const [settings, searchRes] = await Promise.all([
    getSiteSettings(),
    query
      ? (apiGet(`/api/v1/search?q=${encodeURIComponent(query)}&pageSize=20`) as Promise<SearchResponse>).catch(() => null)
      : Promise.resolve(null),
  ]);

  const results = searchRes?.data ?? [];
  const total = searchRes?.meta.total ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1
        className="mb-6 text-2xl font-bold text-neutral-900"
        style={{ fontFamily: "var(--carbon-font-heading)" }}
      >
        Search
      </h1>

      <div className="mb-8">
        <PageSearchInput initialQ={query} inputMode={settings.searchInputMode} />
      </div>

      {query && (
        <p className="mb-6 text-sm text-neutral-500">
          {total === 0
            ? `No results for "${query}"`
            : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-5">
          {results.map((r) => (
            <li key={r.id}>
              <a href={r.url} className="group block rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-neutral-400">
                    {r.type === "post" ? <FileText className="h-4 w-4" /> : <File className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
                      {r.title}
                    </p>
                    {r.excerpt && (
                      <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{r.excerpt}</p>
                    )}
                    <p className="mt-1.5 text-xs text-neutral-400">
                      {r.type === "post" ? "Post" : "Page"}
                      {r.publishedAt && (
                        <>
                          {" · "}
                          {new Date(r.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {!query && (
        <p className="text-sm text-neutral-400">Enter a term above to search posts and pages.</p>
      )}
    </div>
  );
}
