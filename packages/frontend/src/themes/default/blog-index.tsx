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
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function BlogIndex({ posts, page, totalPages }: BlogIndexProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Blog</h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">No posts published yet.</p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {posts.map((post) => (
            <article key={post.id} className="py-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time className="text-sm text-neutral-400">
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </time>
                {post.authorName && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-sm text-neutral-400">{post.authorName}</span>
                  </>
                )}
                {(post.categories ?? []).map((cat) => (
                  <span key={cat.id} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                    {cat.name}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-neutral-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-neutral-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
              )}
              <Link href={`/blog/${post.slug}`} className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600 transition-colors">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between border-t border-neutral-200 pt-6">
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
