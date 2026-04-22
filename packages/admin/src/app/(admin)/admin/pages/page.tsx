import Link from "next/link";
import { Header } from "@/components/admin/header";
import { serverGet } from "@/lib/server-api";
import { Plus } from "lucide-react";

interface Page { id: string; title: string; slug: string; status: string; createdAt: string; }
const statusColors: Record<string, string> = { published: "bg-green-100 text-green-700", draft: "bg-neutral-100 text-neutral-600" };

export default async function PagesPage() {
  const result = await serverGet<{ data: Page[] }>("/api/v1/pages?pageSize=50");
  const rows = result.data ?? [];
  return (
    <div>
      <Header title="Pages" actions={
        <Link href="/admin/pages/new" className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Page
        </Link>
      } />
      <div className="p-6">
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <p className="text-sm">No pages yet.</p>
              <Link href="/admin/pages/new" className="mt-2 text-sm text-neutral-900 underline underline-offset-2">Create your first page</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
                <th className="px-4 py-3" />
              </tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((page) => (
                  <tr key={page.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/pages/${page.id}`} className="font-medium text-neutral-900 hover:underline underline-offset-2">{page.title}</Link>
                      <p className="text-xs text-neutral-400 mt-0.5">/{page.slug}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[page.status] ?? ""}`}>{page.status}</span></td>
                    <td className="px-4 py-3 text-neutral-500">{new Date(page.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/admin/pages/${page.id}`} className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">Edit</Link></td>
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
