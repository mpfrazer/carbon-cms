import { Header } from "@/components/admin/header";
import { TagsManager } from "@/components/admin/tags-manager";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default async function TagsPage() {
  const initial = await db.select().from(tags).orderBy(asc(tags.name));
  return (
    <div>
      <Header title="Tags" />
      <TagsManager initial={initial} />
    </div>
  );
}
