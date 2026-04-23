import { Header } from "@/components/admin/header";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { serverGet } from "@/lib/api/server";

export default async function CategoriesPage() {
  const { data: rows } = await serverGet("/api/v1/categories?pageSize=200") as { data: unknown[] };
  return (
    <div>
      <Header title="Categories" />
      <CategoriesManager initial={rows as Parameters<typeof CategoriesManager>[0]["initial"]} />
    </div>
  );
}
