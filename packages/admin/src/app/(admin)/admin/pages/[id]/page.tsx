import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { serverGet } from "@/lib/server-api";
import { notFound } from "next/navigation";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, allPages] = await Promise.all([
    serverGet<Record<string, unknown> | null>(`/api/v1/pages/${id}`),
    serverGet<{ id: string; title: string }[]>("/api/v1/pages?hierarchy=true"),
  ]);
  if (!page) notFound();
  return (
    <div>
      <Header title="Edit Page" />
      <PageForm page={page as Parameters<typeof PageForm>[0]["page"]} allPages={allPages} />
    </div>
  );
}
