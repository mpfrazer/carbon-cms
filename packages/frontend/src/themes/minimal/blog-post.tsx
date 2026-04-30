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
    <div>
      {featuredImageUrl && (
        <div className="w-full bg-neutral-100" style={{ maxHeight: "480px", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featuredImageUrl} alt={featuredImageAlt ?? ""} className="w-full object-cover" style={{ maxHeight: "480px" }} />
        </div>
      )}

      <article className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          ← All posts
        </Link>

        <header className="mt-4 mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {categories.map((cat) => (
              <span key={cat.id} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                {cat.name}
              </span>
            ))}
          </div>
          <h1
            className="text-5xl font-bold tracking-tight text-neutral-900 mb-6 leading-tight"
            style={{ fontFamily: "var(--carbon-font-heading)" }}
          >
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400 border-b border-neutral-100 pb-8">
            <time>{formatDate(publishedAt ?? createdAt)}</time>
            {authorName && (
              <>
                <span className="text-neutral-200">·</span>
                {authorAvatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authorAvatarUrl} alt={authorName} className="h-6 w-6 rounded-full object-cover" />
                )}
                <span>{authorName}</span>
              </>
            )}
            <span className="text-neutral-200">·</span>
            <span>{estimateReadTime(content)} min read</span>
          </div>
        </header>

        <div
          className="prose prose-neutral max-w-none prose-lg prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-2"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {tags.length > 0 && (
          <footer className="mt-12 pt-8 border-t border-neutral-100 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag.id} className="rounded-md border border-neutral-200 px-3 py-1 text-xs text-neutral-500">
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
    </div>
  );
}
