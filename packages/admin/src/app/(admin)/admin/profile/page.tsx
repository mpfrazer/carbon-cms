import { Header } from "@/components/admin/header";
import { ProfileForm } from "@/components/admin/profile-form";
import { auth } from "@/lib/auth";
import { serverGet } from "@/lib/api/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const { data: user } = await serverGet(`/api/v1/users/${session.user.id}`) as {
    data: Parameters<typeof ProfileForm>[0]["user"] | null;
  };
  if (!user) redirect("/admin/login");

  return (
    <div>
      <Header title="My Profile" />
      <ProfileForm user={user} />
    </div>
  );
}
