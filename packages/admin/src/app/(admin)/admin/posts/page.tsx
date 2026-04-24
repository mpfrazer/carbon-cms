import Link from "next/link";
import { Header } from "@/components/admin/header";
import { serverGet } from "@/lib/api/server";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-neutral-100 text-neutral-600",
  scheduled: "bg-blue-100 text-blue-700",
  archived: "bg-yellow-100 text-yellow-700",
  in_review: "bg-amber-100 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  in_review: "In Review",
};

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "In Review", value: "in_review" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Archived", value: "archived" },
];

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const qs = status ? `?status=${status}&pageSize=50` : "?pageSize=50";
  const { data: rows } = await serverGet(`/api/v1/posts${qs}`) as { data: Post[] };

  return (
    <div>
      <Header title="Posts" actions={
        <Link href="/admin/posts/new" className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Post
        </Link>
      } />
      <div className="p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-neutral-200">
          {FILTER_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/posts?status=${tab.value}` : "/admin/posts"}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                (status ?? "") === tab.value
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <p className="text-sm">No posts{status ? ` with status "${STATUS_LABELS[status] ?? status}"` : ""} yet.</p>
              {!status && (
                <Link href="/admin/posts/new" className="mt-2 text-sm text-neutral-900 underline underline-offset-2">Create your first post</Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/posts/${post.id}`} className="font-medium text-neutral-900 hover:underline underline-offset-2">{post.title}</Link>
                      <p className="text-xs text-neutral-400 mt-0.5">/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[post.status] ?? ""}`}>
                        {STATUS_LABELS[post.status] ?? post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/posts/${post.id}`} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
