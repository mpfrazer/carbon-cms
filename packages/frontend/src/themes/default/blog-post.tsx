import Link from "next/link";

interface BlogPostProps {
  title: string;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function BlogPost({ title, content, publishedAt, createdAt, authorName, categories, tags }: BlogPostProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/blog" className="mb-8 inline-block text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
        ← Back to blog
      </Link>

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categories.map((cat) => (
            <span key={cat.id} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              {cat.name}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
          <time>{formatDate(publishedAt ?? createdAt)}</time>
          {authorName && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{authorName}</span>
            </>
          )}
        </div>
      </header>

      <div
        className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {tags.length > 0 && (
        <footer className="mt-10 border-t border-neutral-200 pt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.id} className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500">
              {tag.name}
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}
