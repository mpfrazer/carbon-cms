import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { serverGet } from "@/lib/api/server";

interface Category { id: string; name: string }
interface Tag { id: string; name: string }

export default async function NewPostPage() {
  const [categoriesRes, tagsRes] = await Promise.all([
    serverGet("/api/v1/categories?pageSize=200"),
    serverGet("/api/v1/tags?pageSize=200"),
  ]) as [{ data: Category[] }, { data: Tag[] }];

  return (
    <div>
      <Header title="New Post" />
      <PostForm allCategories={categoriesRes.data} allTags={tagsRes.data} />
    </div>
  );
}
