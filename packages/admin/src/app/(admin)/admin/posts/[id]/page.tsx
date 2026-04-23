import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { serverGet } from "@/lib/api/server";
import { notFound } from "next/navigation";

interface Category { id: string; name: string; slug?: string }
interface Tag { id: string; name: string; slug?: string }
interface Post { id: string; categories: Category[]; tags: Tag[]; [key: string]: unknown }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [postRes, categoriesRes, tagsRes] = await Promise.all([
    serverGet(`/api/v1/posts/${id}`),
    serverGet("/api/v1/categories?pageSize=200"),
    serverGet("/api/v1/tags?pageSize=200"),
  ]) as [{ data: Post | null }, { data: Category[] }, { data: Tag[] }];

  const post = postRes.data;
  if (!post) notFound();

  const allCategories = categoriesRes.data;
  const allTags = tagsRes.data;

  return (
    <div>
      <Header title="Edit Post" />
      <PostForm
        post={post as Parameters<typeof PostForm>[0]["post"]}
        allCategories={allCategories}
        allTags={allTags}
      />
    </div>
  );
}
