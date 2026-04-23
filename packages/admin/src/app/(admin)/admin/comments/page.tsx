import { Header } from "@/components/admin/header";
import { CommentsTable } from "@/components/admin/comments-table";

export default function CommentsPage() {
  return (
    <div>
      <Header title="Comments" />
      <CommentsTable />
    </div>
  );
}
