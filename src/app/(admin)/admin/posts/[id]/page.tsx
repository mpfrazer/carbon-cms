import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) notFound();

  return (
    <div>
      <Header title="Edit Post" />
      <PostForm post={post} />
    </div>
  );
}
