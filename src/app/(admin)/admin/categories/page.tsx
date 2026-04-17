import { Header } from "@/components/admin/header";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default async function CategoriesPage() {
  const initial = await db.select().from(categories).orderBy(asc(categories.name));
  return (
    <div>
      <Header title="Categories" />
      <CategoriesManager initial={initial} />
    </div>
  );
}
