"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  bio?: string | null;
  website?: string | null;
  suspended: boolean;
  emailVerified: string | null;
  createdAt: string;
}

const ROLES = ["admin", "editor", "author", "subscriber"] as const;
type Role = typeof ROLES[number];

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  editor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  author: "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300",
  subscriber: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

export function UsersManager({ initial }: { initial: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("author");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("author");
  const [editBio, setEditBio] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editEmailVerified, setEditEmailVerified] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const visible = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);

    const res = await fetch("/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
    });

    const json = await res.json();
    if (!res.ok) { setFormError(json.error ?? "Something went wrong"); setFormSaving(false); return; }

    setUsers((prev) => [json.data ?? json, ...prev]);
    setNewName(""); setNewEmail(""); setNewPassword(""); setNewRole("author");
    setShowForm(false);
    setFormSaving(false);
    router.refresh();
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setEditName(user.name ?? "");
    setEditEmail(user.email);
    setEditRole(user.role as Role);
    setEditBio(user.bio ?? "");
    setEditWebsite(user.website ?? "");
    setEditEmailVerified(!!user.emailVerified);
    setEditPassword("");
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditSaving(true);

    const body: Record<string, unknown> = {
      name: editName, email: editEmail, role: editRole,
      bio: editBio || null, website: editWebsite || null,
      emailVerified: editEmailVerified,
    };
    if (editPassword) body.password = editPassword;

    const res = await fetch(`/api/v1/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setEditSaving(false);

    if (!res.ok) { setEditError(json.error ?? "Something went wrong"); return; }

    setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, ...json.data } : u));
    setEditingUser(null);
    router.refresh();
  }

  async function handleSuspend(user: User) {
    const action = user.suspended ? "unsuspend" : "suspend";
    if (!confirm(`${action === "suspend" ? "Suspend" : "Unsuspend"} ${user.name ?? user.email}?`)) return;

    const res = await fetch(`/api/v1/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !user.suspended }),
    });

    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, suspended: !user.suspended } : u));
      router.refresh();
    }
  }

  async function handleDelete(id: string, name: string | null) {
    if (!confirm(`Remove ${name ?? "this user"}? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/users/${id}`, { method: "DELETE" });
    if (res.ok) { setUsers((prev) => prev.filter((u) => u.id !== id)); router.refresh(); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1">
          {(["all", ...ROLES] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r as Role | "all")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${roleFilter === r ? "bg-neutral-900 text-white" : "border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"}`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors">
          {showForm ? "Cancel" : "Add user"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">New user</h2>
          {formError && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Temporary password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} className={inputClass}>
                {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={formSaving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {formSaving ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-neutral-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Edit user</h2>
              <button onClick={() => setEditingUser(null)} className="text-neutral-400 hover:text-neutral-600">✕</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {editError && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{editError}</div>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-700">Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-700">Email</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-700">Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} className={inputClass}>
                    {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-700">New password</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={8} placeholder="Leave blank to keep current" className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">Bio</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">Website</label>
                <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://…" className={inputClass} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="editEmailVerified" checked={editEmailVerified}
                  onChange={(e) => setEditEmailVerified(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
                <label htmlFor="editEmailVerified" className="text-sm text-neutral-700">Mark email as verified</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Role</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Verified</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
              {visible.map((user) => (
                <tr key={user.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/50 ${user.suspended ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleColors[user.role] ?? ""}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                    {user.emailVerified ? (
                      <span className="text-green-600 dark:text-green-400">✓ Verified</span>
                    ) : (
                      <span className="text-neutral-400">Unverified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.suspended ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Suspended</span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(user)} className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors">Edit</button>
                      <button onClick={() => handleSuspend(user)}
                        className={`text-xs transition-colors ${user.suspended ? "text-green-600 hover:text-green-800" : "text-amber-600 hover:text-amber-800"}`}>
                        {user.suspended ? "Unsuspend" : "Suspend"}
                      </button>
                      <button onClick={() => handleDelete(user.id, user.name)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
