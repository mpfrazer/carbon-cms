import { Header } from "@/components/admin/header";
import { TagsManager } from "@/components/admin/tags-manager";
import { serverGet } from "@/lib/server-api";

export default async function TagsPage() {
  const result = await serverGet<{ data: { id: string; name: string; slug: string; createdAt: string }[] }>("/api/v1/tags?pageSize=200");
  return (
    <div>
      <Header title="Tags" />
      <TagsManager initial={result.data ?? []} />
    </div>
  );
}
