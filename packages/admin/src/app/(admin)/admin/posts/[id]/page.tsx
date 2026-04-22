import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { serverGet } from "@/lib/server-api";
import { notFound } from "next/navigation";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, catsResult, tagsResult] = await Promise.all([
    serverGet<Record<string, unknown> | null>(`/api/v1/posts/${id}`),
    serverGet<{ data: { id: string; name: string }[] }>("/api/v1/categories?pageSize=200"),
    serverGet<{ data: { id: string; name: string }[] }>("/api/v1/tags?pageSize=200"),
  ]);
  if (!post) notFound();
  return (
    <div>
      <Header title="Edit Post" />
      <PostForm post={post as Parameters<typeof PostForm>[0]["post"]} allCategories={catsResult.data ?? []} allTags={tagsResult.data ?? []} />
    </div>
  );
}
