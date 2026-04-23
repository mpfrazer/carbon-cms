"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
    } else {
      router.push("/account");
      router.refresh();
    }
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {searchParams.get("reset") === "1" && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Password reset successfully. You can now sign in.
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required autoComplete="email" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-neutral-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2">
            Forgot password?
          </Link>
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          required autoComplete="current-password" className={inputClass} />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        No account?{" "}
        <Link href="/register" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600">
          Register
        </Link>
      </p>
    </form>
  );
}
