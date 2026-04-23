import { Header } from "@/components/admin/header";
import { TagsManager } from "@/components/admin/tags-manager";
import { serverGet } from "@/lib/api/server";

export default async function TagsPage() {
  const { data: rows } = await serverGet("/api/v1/tags?pageSize=200") as { data: unknown[] };
  return (
    <div>
      <Header title="Tags" />
      <TagsManager initial={rows as Parameters<typeof TagsManager>[0]["initial"]} />
    </div>
  );
}
