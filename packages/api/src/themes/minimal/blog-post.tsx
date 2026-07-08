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

export function BlogPost({ title, content, publishedAt, createdAt, authorName, tags }: BlogPostProps) {
  return (
    <article>
      <p>
        <Link href="/blog">← Back to blog</Link>
      </p>
      <header>
        <h1>{title}</h1>
        <p>
          <time>
            {new Date(publishedAt ?? createdAt).toISOString().slice(0, 10)}
          </time>
          {authorName && <> · {authorName}</>}
        </p>
      </header>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {tags.length > 0 && (
        <footer>
          <p>Tags: {tags.map((t) => t.name).join(", ")}</p>
        </footer>
      )}
    </article>
  );
}
