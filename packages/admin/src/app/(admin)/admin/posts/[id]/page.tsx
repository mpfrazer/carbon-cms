import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";
import { serverGet } from "@/lib/api/server";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";

interface Category { id: string; name: string; slug?: string }
interface Tag { id: string; name: string; slug?: string }
interface Post {
  id: string; title: string; slug: string; content: string; status: string;
  excerpt?: string | null; metaTitle?: string | null; metaDescription?: string | null;
  reviewNote?: string | null;
  categories: Category[]; tags: Tag[];
  featuredImage?: { id: string; url: string; altText: string | null } | null;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role ?? "author";

  const [postRes, categoriesRes, tagsRes] = await Promise.all([
    serverGet(`/api/v1/posts/${id}`),
    serverGet("/api/v1/categories?pageSize=200"),
    serverGet("/api/v1/tags?pageSize=200"),
  ]) as [{ data: Post | null }, { data: Category[] }, { data: Tag[] }];

  const post = postRes.data;
  if (!post) notFound();

  const allCategories = categoriesRes.data;
  const allTags = tagsRes.data;

  return (
    <div>
      <Header title="Edit Post" />
      <PostForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          status: post.status,
          excerpt: post.excerpt,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          reviewNote: post.reviewNote,
          categories: post.categories,
          tags: post.tags,
          featuredImageId: post.featuredImage?.id ?? null,
          featuredImageUrl: post.featuredImage?.url ?? null,
        }}
        allCategories={allCategories}
        allTags={allTags}
        userRole={userRole}
      />
    </div>
  );
}
