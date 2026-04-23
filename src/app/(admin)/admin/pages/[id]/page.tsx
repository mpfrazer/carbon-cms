import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [[page], allPages] = await Promise.all([
    db.select().from(pages).where(eq(pages.id, id)).limit(1),
    db.select({ id: pages.id, title: pages.title }).from(pages).orderBy(asc(pages.title)),
  ]);
  if (!page) notFound();
  return (
    <div>
      <Header title="Edit Page" />
      <PageForm page={page as Parameters<typeof PageForm>[0]["page"]} allPages={allPages} />
    </div>
  );
}
