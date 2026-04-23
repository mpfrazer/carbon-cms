"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  name: string;
  bio: string | null;
  website: string | null;
  avatarUrl: string | null;
}

export function AccountEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);

    const body: Record<string, unknown> = {
      name,
      bio: bio || null,
      website: website || null,
    };
    if (password) body.password = password;

    const res = await fetch("/api/v1/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to save changes.");
      return;
    }

    setSaved(true);
    setPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setSaved(false);
      router.push("/account");
      router.refresh();
    }, 1200);
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Changes saved.</div>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          required autoComplete="name" className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-neutral-700">Website</label>
        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com" className={inputClass} />
      </div>

      <div className="border-t border-neutral-200 pt-5 space-y-4">
        <p className="text-sm font-medium text-neutral-700">Change password <span className="font-normal text-neutral-400">(leave blank to keep current)</span></p>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            minLength={8} autoComplete="new-password" placeholder="Min. 8 characters" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password" className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
