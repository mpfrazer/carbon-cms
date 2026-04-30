import Link from "next/link";
import { CommentsSection } from "@/components/comments-section";
import type { Comment } from "@/components/comments-section";
import { estimateReadTime } from "@/lib/read-time";

interface BlogPostProps {
  title: string;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  authorAvatarUrl?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
  postId: string;
  comments: Comment[];
  allowComments: boolean;
  requireLoginToComment: boolean;
  currentUser: { id: string; name: string; email: string } | null;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function BlogPost({ title, content, publishedAt, createdAt, authorName, authorAvatarUrl, featuredImageUrl, featuredImageAlt, categories, tags, postId, comments, allowComments, requireLoginToComment, currentUser }: BlogPostProps) {
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
              {authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorAvatarUrl} alt={authorName} className="h-5 w-5 rounded-full object-cover" />
              ) : null}
              <span>{authorName}</span>
            </>
          )}
          <span className="text-neutral-300">·</span>
          <span>{estimateReadTime(content)} min read</span>
        </div>
      </header>

      {featuredImageUrl && (
        <div className="mb-10 -mx-4 sm:-mx-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featuredImageUrl} alt={featuredImageAlt ?? ""} className="w-full object-cover" />
        </div>
      )}

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

      <CommentsSection
        postId={postId}
        initialComments={comments}
        allowComments={allowComments}
        requireLoginToComment={requireLoginToComment}
        currentUser={currentUser}
      />
    </article>
  );
}
