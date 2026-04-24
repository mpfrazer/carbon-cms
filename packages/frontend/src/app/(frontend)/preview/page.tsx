import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { verifyPreviewToken } from "@/lib/preview-token";
import { getThemeComponents } from "@/lib/theme-provider";
import { apiGet } from "@/lib/api/client";

export const metadata: Metadata = { robots: "noindex, nofollow" };

interface Post {
  id: string; title: string; slug: string; content: string; status: string;
  excerpt: string | null; publishedAt: string | null; createdAt: string; updatedAt: string;
  categories: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string }[];
}

interface Page {
  id: string; title: string; slug: string; content: string; status: string; updatedAt: string;
}

type Props = { searchParams: Promise<{ token?: string }> };

export default async function PreviewPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) notFound();

  const claim = verifyPreviewToken(token);
  if (!claim) notFound();

  const { BlogPost, PageContent } = await getThemeComponents();

  if (claim.kind === "post") {
    const { data: post } = await apiGet(`/api/v1/posts/${claim.id}`) as { data: Post | null };
    if (!post) notFound();

    return (
      <>
        <PreviewBanner kind="post" />
        <BlogPost
          title={post.title}
          content={post.content}
          publishedAt={post.publishedAt ? new Date(post.publishedAt) : null}
          createdAt={new Date(post.createdAt)}
          authorName={null}
          categories={post.categories}
          tags={post.tags}
          postId={post.id}
          comments={[]}
          allowComments={false}
          requireLoginToComment={false}
          currentUser={null}
        />
      </>
    );
  }

  const { data: page } = await apiGet(`/api/v1/pages/${claim.id}`) as { data: Page | null };
  if (!page) notFound();

  return (
    <>
      <PreviewBanner kind="page" />
      <PageContent title={page.title} content={page.content} updatedAt={new Date(page.updatedAt)} />
    </>
  );
}

function PreviewBanner({ kind }: { kind: "post" | "page" }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center bg-amber-400 px-4 py-2 text-sm font-medium text-amber-900">
      Draft preview — this {kind} is not published
    </div>
  );
}
