import { Header } from "@/components/admin/header";
import { UsersManager } from "@/components/admin/users-manager";
import { serverGet } from "@/lib/server-api";

export default async function UsersPage() {
  const result = await serverGet<{ data: { id: string; name: string; email: string; role: string; createdAt: string }[] }>("/api/v1/users?pageSize=200");
  return (
    <div>
      <Header title="Users" />
      <UsersManager initial={result.data ?? []} />
    </div>
  );
}
