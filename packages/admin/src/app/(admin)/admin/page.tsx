import { Header } from "@/components/admin/header";
import { serverGet } from "@/lib/api/server";
import { FileText, File, MessageSquare, Users, Image } from "lucide-react";

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  totalPages: number;
  pendingComments: number;
  totalUsers: number;
  totalMedia: number;
}

export default async function DashboardPage() {
  const { data: stats } = await serverGet("/api/v1/stats") as { data: Stats };
  const { totalPosts, publishedPosts, totalPages, pendingComments, totalUsers, totalMedia } = stats;

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
      <div className="p-6">
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
      </div>
    </div>
  );
}
