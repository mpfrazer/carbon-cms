import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountEditForm } from "@/components/account-edit-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit profile" };

interface Profile {
  name: string; bio: string | null; website: string | null; avatarUrl: string | null;
}

export default async function AccountEditPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${process.env.AUTH_SECRET}`,
      "X-User-Id": session.user.id ?? "",
    },
    cache: "no-store",
  });

  if (!res.ok) redirect("/login");
  const { data: profile } = await res.json() as { data: Profile };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-neutral-900">Edit profile</h1>
      <AccountEditForm profile={profile} />
    </div>
  );
}
