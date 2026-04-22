import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { serverGet } from "@/lib/server-api";

export default async function NewPagePage() {
  const allPages = await serverGet<{ id: string; title: string }[]>("/api/v1/pages?hierarchy=true");
  return (
    <div>
      <Header title="New Page" />
      <PageForm allPages={allPages} />
    </div>
  );
}
