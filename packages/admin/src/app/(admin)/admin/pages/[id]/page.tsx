import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { serverGet } from "@/lib/api/server";
import { notFound } from "next/navigation";

interface PageItem { id: string; title: string }

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pageRes, allPagesRes] = await Promise.all([
    serverGet(`/api/v1/pages/${id}`),
    serverGet("/api/v1/pages?hierarchy=true"),
  ]) as [{ data: Parameters<typeof PageForm>[0]["page"] | null }, { data: PageItem[] }];

  if (!pageRes.data) notFound();
  return (
    <div>
      <Header title="Edit Page" />
      <PageForm page={pageRes.data} allPages={allPagesRes.data} />
    </div>
  );
}
