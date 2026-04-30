import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My account" };

interface Profile {
  id: string; name: string; email: string; role: string;
  bio: string | null; website: string | null; avatarUrl: string | null;
  emailVerified: string | null; createdAt: string;
}

export default async function AccountPage() {
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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My account</h1>
        <Link href="/account/edit"
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
          Edit profile
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        <Row label="Name" value={profile.name} />
        <Row label="Email" value={profile.email} />
        {profile.bio && <Row label="Bio" value={profile.bio} />}
        {profile.website && (
          <div className="flex gap-6 px-6 py-4">
            <span className="w-28 shrink-0 text-sm text-neutral-500">Website</span>
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="text-sm text-neutral-900 underline underline-offset-2 hover:text-neutral-600">
              {profile.website}
            </a>
          </div>
        )}
        <Row label="Member since" value={new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
      </div>

      <form action="/api/auth/signout" method="POST" className="mt-6">
        <button type="submit"
          className="text-sm text-red-500 hover:text-red-700 transition-colors underline underline-offset-2">
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-6 px-6 py-4">
      <span className="w-28 shrink-0 text-sm text-neutral-500">{label}</span>
      <span className="text-sm text-neutral-900">{value}</span>
    </div>
  );
}
