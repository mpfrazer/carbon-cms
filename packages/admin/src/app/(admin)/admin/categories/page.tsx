import { Header } from "@/components/admin/header";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { serverGet } from "@/lib/server-api";

export default async function CategoriesPage() {
  const result = await serverGet<{ data: { id: string; name: string; slug: string; description: string | null; parentId: string | null; createdAt: string }[] }>("/api/v1/categories?pageSize=200");
  return (
    <div>
      <Header title="Categories" />
      <CategoriesManager initial={result.data ?? []} />
    </div>
  );
}
