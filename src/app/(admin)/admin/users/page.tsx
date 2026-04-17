import { Header } from "@/components/admin/header";
import { UsersManager } from "@/components/admin/users-manager";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export default async function UsersPage() {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div>
      <Header title="Users" />
      <UsersManager initial={rows} />
    </div>
  );
}
