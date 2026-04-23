import { Header } from "@/components/admin/header";
import { PageForm } from "@/components/admin/page-form";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default async function NewPagePage() {
  const allPages = await db.select({ id: pages.id, title: pages.title }).from(pages).orderBy(asc(pages.title));
  return (
    <div>
      <Header title="New Page" />
      <PageForm allPages={allPages} />
    </div>
  );
}
