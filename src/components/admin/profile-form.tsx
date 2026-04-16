"use client";

import { useState } from "react";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    bio?: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaving(true);

    const res = await fetch(`/api/v1/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, bio: bio || null }),
    });

    const json = await res.json();
    if (!res.ok) {
      setProfileError(json.error ?? "Failed to update profile");
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);

    const res = await fetch(`/api/v1/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });

    const json = await res.json();
    if (!res.ok) {
      setPasswordError(json.error ?? "Failed to update password");
    } else {
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    }
    setPasswordSaving(false);
  }

  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <div className="p-6 space-y-10 max-w-xl">

      {/* Profile */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">Profile</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{profileError}</div>
          )}
          {profileSaved && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Profile updated.</div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass}
              placeholder="A short bio shown on your posts" />
          </div>

          <button type="submit" disabled={profileSaving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <hr className="border-neutral-200" />

      {/* Password */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{passwordError}</div>
          )}
          {passwordSaved && (
            <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Password updated.</div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              required minLength={8} autoComplete="new-password" className={inputClass} placeholder="Minimum 8 characters" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required autoComplete="new-password" className={inputClass} />
          </div>

          <button type="submit" disabled={passwordSaving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

    </div>
  );
}
