import Link from "next/link";
import { FileText, File, Search } from "lucide-react";

interface SearchResult {
  type: "post" | "page";
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  url: string;
}

interface SearchPageProps {
  query: string;
  results: SearchResult[];
  total: number;
  inputMode: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SearchPage({ query, results, total }: SearchPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
      <header className="mb-10 border-b border-neutral-200 pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Search</h1>
      </header>

      <form action="/search" method="get" className="mb-8">
        <label htmlFor="q" className="sr-only">Search</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search posts and pages…"
            className="w-full rounded-lg border border-neutral-200 bg-white py-3 pl-10 pr-4 text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          />
        </div>
      </form>

      {query && (
        <p className="mb-6 text-sm text-neutral-500">
          {total === 0
            ? `No results for "${query}"`
            : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                href={r.url}
                className="group block rounded-xl border border-neutral-200 p-4 hover:border-neutral-400 hover:shadow-sm transition-all"
              >
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
                      {r.publishedAt && ` · ${formatDate(r.publishedAt)}`}
                    </p>
                  </div>
                </div>
              </Link>
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
