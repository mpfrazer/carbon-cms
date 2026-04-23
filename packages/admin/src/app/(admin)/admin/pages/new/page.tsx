import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { serverGet } from "@/lib/api/server";

interface PageItem { id: string; title: string }

export default async function NewPagePage() {
  const { data: allPages } = await serverGet("/api/v1/pages?hierarchy=true") as { data: PageItem[] };
  return (
    <div>
      <Header title="New Page" />
      <PageForm allPages={allPages} />
    </div>
  );
}
