import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { db } from "@/lib/db";
import { categories, tags } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export default async function NewPostPage() {
  const [allCategories, allTags] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)).limit(200),
    db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name)).limit(200),
  ]);
  return (
    <div>
      <Header title="New Post" />
      <PostForm allCategories={allCategories} allTags={allTags} />
    </div>
  );
}
