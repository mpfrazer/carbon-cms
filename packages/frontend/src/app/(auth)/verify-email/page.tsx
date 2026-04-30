import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify email" };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="text-neutral-600">Invalid verification link.</p>
      </div>
    );
  }

  let verified = false;
  let errorMsg = "";

  try {
    const apiUrl = process.env.CARBON_API_URL ?? "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok && json.data?.verified) {
      verified = true;
    } else {
      errorMsg = json.error ?? "Verification failed.";
    }
  } catch {
    errorMsg = "Something went wrong. Please try again.";
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center space-y-4">
      {verified ? (
        <>
          <h1 className="text-2xl font-bold text-neutral-900">Email verified</h1>
          <p className="text-neutral-600">Your account is active. You can now sign in.</p>
          <Link href="/login" className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors">
            Sign in
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-neutral-900">Verification failed</h1>
          <p className="text-neutral-600">{errorMsg}</p>
          <Link href="/register" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600 text-sm">
            Register again
          </Link>
        </>
      )}
    </div>
  );
}
