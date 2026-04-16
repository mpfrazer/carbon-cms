import { Header } from "@/components/admin/header";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  editor: "bg-blue-100 text-blue-700",
  author: "bg-neutral-100 text-neutral-600",
};

export default async function UsersPage() {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div>
      <Header title="Users" />
      <div className="p-6">
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{user.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleColors[user.role] ?? ""}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(user.createdAt).toLocaleDateString()}
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
