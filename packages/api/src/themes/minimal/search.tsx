import Link from "next/link";

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

export function SearchPage({ query, results, total }: SearchPageProps) {
  return (
    <section>
      <h1>Search</h1>
      <form action="/search" method="get">
        <label htmlFor="q">Query</label>
        <input id="q" name="q" type="search" defaultValue={query} />
        <button type="submit">Search</button>
      </form>
      {query && (
        <p>
          {total === 0
            ? `No results for "${query}"`
            : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
        </p>
      )}
      {results.length > 0 && (
        <ul>
          {results.map((r) => (
            <li key={r.id}>
              <Link href={r.url}>{r.title}</Link>
              {" — "}
              <span>{r.type === "post" ? "Post" : "Page"}</span>
              {r.excerpt && (
                <>
                  <br />
                  <span>{r.excerpt}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {!query && <p>Enter a term above to search posts and pages.</p>}
    </section>
  );
}
