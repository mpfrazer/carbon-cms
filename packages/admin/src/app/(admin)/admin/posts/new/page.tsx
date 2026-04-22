import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { serverGet } from "@/lib/server-api";

export default async function NewPostPage() {
  const [catsResult, tagsResult] = await Promise.all([
    serverGet<{ data: { id: string; name: string }[] }>("/api/v1/categories?pageSize=200"),
    serverGet<{ data: { id: string; name: string }[] }>("/api/v1/tags?pageSize=200"),
  ]);
  return (
    <div>
      <Header title="New Post" />
      <PostForm allCategories={catsResult.data ?? []} allTags={tagsResult.data ?? []} />
    </div>
  );
}
