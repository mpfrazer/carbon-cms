import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { db } from "@/lib/db";
import { posts, categories, tags, postCategories, postTags } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [[post], postCats, postTagRows, allCategories, allTags] = await Promise.all([
    db.select().from(posts).where(eq(posts.id, id)).limit(1),
    db.select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, id)),
    db.select({ id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, id)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)).limit(200),
    db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name)).limit(200),
  ]);

  if (!post) notFound();

  return (
    <div>
      <Header title="Edit Post" />
      <PostForm
        post={{ ...post, categories: postCats, tags: postTagRows }}
        allCategories={allCategories}
        allTags={allTags}
      />
    </div>
  );
}
