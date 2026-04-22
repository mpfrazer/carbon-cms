"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export function TagsManager({ initial }: { initial: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(val: string) {
    setName(val);
    setSlug(
      val.toLowerCase().trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    const res = await fetch("/api/v1/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to create tag");
    } else {
      setTags((prev) => [json.data, ...prev]);
      setName(""); setSlug("");
    }
    setAdding(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/v1/tags/${id}`, { method: "DELETE" });
    if (res.ok) setTags((prev) => prev.filter((t) => t.id !== id));
  }

  const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <div className="p-6 space-y-6">
      {/* Add form */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">Add Tag</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Name *</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} required className={inputClass} placeholder="JavaScript" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Slug *</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputClass + " font-mono"} placeholder="javascript" />
          </div>
          <button type="submit" disabled={adding}
            className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            {adding ? "Adding…" : "Add Tag"}
          </button>
        </form>
      </div>

      {/* Tag cloud + table */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {tags.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No tags yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{tag.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{tag.slug}</td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(tag.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(tag.id, tag.name)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
