"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Registration failed. Please try again.");
      return;
    }

    if (json.data?.requiresEmailVerification) {
      setVerificationRequired(true);
    } else {
      router.push("/login?registered=1");
    }
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  if (verificationRequired) {
    return (
      <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-4 text-sm text-blue-800 space-y-2">
        <p className="font-medium">Check your email</p>
        <p>We&apos;ve sent a verification link to <strong>{email}</strong>. Click it to activate your account.</p>
        <button
          onClick={async () => {
            await fetch("/api/v1/auth/resend-verification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
          }}
          className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
        >
          Resend email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          required autoComplete="name" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required autoComplete="email" className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          required minLength={8} autoComplete="new-password" className={inputClass}
          placeholder="Min. 8 characters" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600">
          Sign in
        </Link>
      </p>
    </form>
  );
}
