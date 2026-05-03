"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);

  useEffect(() => {
    fetch("/api/v1/setup").then((r) => r.json()).then((json) => {
      if (json.data?.needed) setSetupNeeded(true);
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Carbon</span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Sign in to your admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="you@example.com" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <Link href="/admin/forgot-password" className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline underline-offset-2">
                Forgot password?
              </Link>
            </div>
            <input id="password" name="password" type="password" required autoComplete="current-password"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 transition-colors hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {searchParams.get("reset") === "1" && (
          <p className="mt-4 text-center text-sm text-green-700 dark:text-green-400">Password reset successfully. You can now sign in.</p>
        )}

        {searchParams.get("setup") === "1" && (
          <p className="mt-4 text-center text-sm text-green-700 dark:text-green-400">Admin account created. You can now sign in.</p>
        )}

        {setupNeeded && (
          <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            First time here?{" "}
            <Link href="/admin/setup" className="text-neutral-900 dark:text-neutral-100 underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300">
              Set up your account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
