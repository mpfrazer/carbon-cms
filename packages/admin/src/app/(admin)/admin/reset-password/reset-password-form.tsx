"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to reset password. The link may have expired.");
        return;
      }
      router.push("/admin/login?reset=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="h-6 w-6 text-neutral-900" />
            <span className="text-2xl font-semibold text-neutral-900">Carbon</span>
          </div>
          <p className="text-sm text-neutral-500">Set a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          {!token && (
            <p className="text-sm text-neutral-600">
              Invalid reset link.{" "}
              <Link href="/admin/forgot-password" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600">
                Request a new one
              </Link>.
            </p>
          )}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={!token}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium text-neutral-700">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={!token}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
