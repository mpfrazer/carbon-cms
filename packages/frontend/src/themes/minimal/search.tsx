import { FileText, File } from "lucide-react";
import { PageSearchInput } from "@/components/page-search-input";
import type { SearchPageProps } from "@/lib/theme-provider";

export function SearchPage({ query, results, total, inputMode }: SearchPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-neutral-900" style={{ fontFamily: "var(--carbon-font-heading)" }}>
        Search
      </h1>

      <div className="mb-8">
        <PageSearchInput initialQ={query} inputMode={inputMode} />
      </div>

      {query && (
        <p className="mb-6 text-sm text-neutral-500">
          {total === 0
            ? `No results for "${query}"`
            : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {results.map((r) => (
            <li key={r.id}>
              <a href={r.url} className="group flex items-start gap-3 py-5 hover:text-neutral-600 transition-colors">
                <span className="mt-0.5 shrink-0 text-neutral-400">
                  {r.type === "post" ? <FileText className="h-4 w-4" /> : <File className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
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
