import { Header } from "@/components/admin/header";
import { serverGet } from "@/lib/api/server";
import { FileText, File, MessageSquare, Users, Image, Clock } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  totalPages: number;
  pendingComments: number;
  totalUsers: number;
  totalMedia: number;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  scheduledAt: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const [{ data: stats }, { data: scheduledData }] = await Promise.all([
    serverGet("/api/v1/stats") as Promise<{ data: Stats }>,
    serverGet("/api/v1/posts?status=scheduled&pageSize=10") as Promise<{ data: Post[] }>,
  ]);

  const { totalPosts, publishedPosts, totalPages, pendingComments, totalUsers, totalMedia } = stats;
  const scheduledPosts: Post[] = scheduledData ?? [];

  const cards = [
    { label: "Total Posts", value: totalPosts, sub: `${publishedPosts} published`, icon: FileText, href: "/admin/posts" },
    { label: "Pages", value: totalPages, sub: "all pages", icon: File, href: "/admin/pages" },
    { label: "Comments", value: pendingComments, sub: "awaiting moderation", icon: MessageSquare, href: "/admin/comments" },
    { label: "Users", value: totalUsers, sub: "team members", icon: Users, href: "/admin/users" },
    { label: "Media", value: totalMedia, sub: "uploaded files", icon: Image, href: "/admin/media" },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map(({ label, value, sub, icon: Icon, href }) => (
            <a key={href} href={href} className="group rounded-lg border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-500">{label}</span>
                <Icon className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </div>
              <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
              <p className="mt-1 text-xs text-neutral-400">{sub}</p>
            </a>
          ))}
        </div>

        {scheduledPosts.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <h2 className="text-sm font-semibold text-neutral-700">Scheduled posts</h2>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-600">Publishes at</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {scheduledPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{post.title}</td>
                      <td className="px-4 py-3 text-neutral-500">{formatDateTime(post.scheduledAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/posts/${post.id}`}
                          className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
