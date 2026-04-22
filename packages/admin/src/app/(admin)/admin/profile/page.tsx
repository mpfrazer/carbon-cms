import { Header } from "@/components/admin/header";
import { ProfileForm } from "@/components/admin/profile-form";
import { auth } from "@/lib/auth";
import { serverGet } from "@/lib/server-api";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  const user = await serverGet<{ id: string; name: string; email: string; bio: string | null } | null>(`/api/v1/users/${session.user.id}`);
  if (!user) redirect("/admin/login");
  return (
    <div>
      <Header title="My Profile" />
      <ProfileForm user={user} />
    </div>
  );
}
