import { Header } from "@/components/admin/header";
import { UsersManager } from "@/components/admin/users-manager";
import { serverGet } from "@/lib/api/server";

export default async function UsersPage() {
  const { data: rows } = await serverGet("/api/v1/users?pageSize=500") as { data: unknown[] };
  return (
    <div>
      <Header title="Users" />
      <UsersManager initial={rows as Parameters<typeof UsersManager>[0]["initial"]} />
    </div>
  );
}
