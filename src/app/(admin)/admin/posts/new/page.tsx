import { Header } from "@/components/admin/header";
import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
  return (
    <div>
      <Header title="New Post" />
      <PostForm />
    </div>
  );
}
