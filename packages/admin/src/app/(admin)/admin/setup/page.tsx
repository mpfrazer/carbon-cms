"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/setup")
      .then((r) => r.json())
      .then((json) => {
        if (!json.data?.needed) router.replace("/admin/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/v1/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Setup failed.");
      return;
    }

    router.push("/admin/login?setup=1");
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2">
            <Pencil className="h-6 w-6 text-neutral-900" />
            <span className="text-2xl font-semibold text-neutral-900">Carbon</span>
          </div>
          <p className="text-sm text-neutral-500">Create your admin account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              required autoComplete="name" className={inputClass} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" className={inputClass} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} autoComplete="new-password" className={inputClass} placeholder="Min. 8 characters" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {loading ? "Creating account…" : "Create admin account"}
          </button>
        </form>
      </div>
    </div>
  );
}
