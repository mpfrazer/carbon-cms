import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) notFound();

  return (
    <div>
      <Header title="Edit Page" />
      <PageForm page={page} />
    </div>
  );
}
