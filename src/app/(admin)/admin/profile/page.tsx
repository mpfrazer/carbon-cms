import { Header } from "@/components/admin/header";
import { ProfileForm } from "@/components/admin/profile-form";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, bio: users.bio })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/admin/login");

  return (
    <div>
      <Header title="My Profile" />
      <ProfileForm user={user} />
    </div>
  );
}
