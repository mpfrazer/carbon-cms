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

export function BlogIndex({ posts, page, totalPages }: BlogIndexProps) {
  return (
    <section>
      <h1>Blog</h1>
      {posts.length === 0 ? (
        <p>No posts published yet.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>
                <time>
                  {new Date(post.publishedAt ?? post.createdAt).toISOString().slice(0, 10)}
                </time>
                {post.authorName && <> · {post.authorName}</>}
              </p>
              {post.excerpt && <p>{post.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <nav>
          {page > 1 && <Link href={`/blog?page=${page - 1}`}>← Newer</Link>}
          {page < totalPages && <Link href={`/blog?page=${page + 1}`}>Older →</Link>}
        </nav>
      )}
    </section>
  );
}
