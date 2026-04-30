import Link from "next/link";

interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  categories: { id: string; name: string; slug: string }[];
}

interface BlogIndexProps {
  posts: PostSummary[];
  page: number;
  totalPages: number;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function BlogIndex({ posts, page, totalPages }: BlogIndexProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <header className="mb-12 border-b border-neutral-200 pb-8">
        <h1 className="text-5xl font-bold tracking-tight text-neutral-900" style={{ fontFamily: "var(--carbon-font-heading)" }}>Blog</h1>
        <p className="mt-2 text-neutral-500">{posts.length > 0 ? `${posts.length} article${posts.length !== 1 ? "s" : ""}` : "No posts yet"}</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">No posts published yet.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="group rounded-xl border border-neutral-200 bg-white p-6 hover:border-neutral-400 hover:shadow-sm transition-all">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(post.categories ?? []).map((cat) => (
                  <span key={cat.id} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                    {cat.name}
                  </span>
                ))}
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-2 leading-snug" style={{ fontFamily: "var(--carbon-font-heading)" }}>
                <Link href={`/blog/${post.slug}`} className="hover:text-neutral-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100">
                <time className="text-xs text-neutral-400">{formatDate(post.publishedAt ?? post.createdAt)}</time>
                {post.authorName && <span className="text-xs text-neutral-400">{post.authorName}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-between border-t border-neutral-200 pt-8">
          {page > 1 ? (
            <Link href={`/blog?page=${page - 1}`} className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
              ← Newer posts
            </Link>
          ) : <span />}
          {page < totalPages && (
            <Link href={`/blog?page=${page + 1}`} className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
              Older posts →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
