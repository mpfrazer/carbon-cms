import { Header } from "@/components/admin/header";
import { db } from "@/lib/db";
import { posts, pages, comments, users, media } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { FileText, File, MessageSquare, Users, Image } from "lucide-react";

export default async function DashboardPage() {
  const [
    [{ value: totalPosts }],
    [{ value: publishedPosts }],
    [{ value: totalPages }],
    [{ value: pendingComments }],
    [{ value: totalUsers }],
    [{ value: totalMedia }],
  ] = await Promise.all([
    db.select({ value: count() }).from(posts),
    db.select({ value: count() }).from(posts).where(eq(posts.status, "published")),
    db.select({ value: count() }).from(pages),
    db.select({ value: count() }).from(comments).where(eq(comments.status, "pending")),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(media),
  ]);

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
