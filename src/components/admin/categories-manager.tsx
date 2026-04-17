"use client";

import React, { useState } from "react";
import { Trash2, Plus, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: Date;
}

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
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

    const res = await fetch("/api/v1/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description: description || undefined, parentId: parentId || undefined }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to create category");
    } else {
      setCategories((prev) => [json.data, ...prev]);
      setName(""); setSlug(""); setDescription(""); setParentId("");
    }
    setAdding(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Posts in this category will be unaffected.`)) return;
    const res = await fetch(`/api/v1/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";
  const roots = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  return (
    <div className="p-6 space-y-6">
      {/* Add form */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4">Add Category</h2>
        {error && <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Name *</label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} required className={inputClass + " w-full"} placeholder="Technology" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Slug *</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputClass + " w-full font-mono"} placeholder="technology" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Parent</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass + " w-full"}>
              <option value="">None</option>
              {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-600">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass + " w-full"} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" disabled={adding}
              className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              {adding ? "Adding…" : "Add Category"}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-400">No categories yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Description</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {roots.map((cat) => (
                <React.Fragment key={cat.id}>
                  <tr className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{cat.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{cat.slug}</td>
                    <td className="px-4 py-3 text-neutral-500">{cat.description ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {children.filter((c) => c.parentId === cat.id).map((child) => (
                    <tr key={child.id} className="hover:bg-neutral-50 bg-neutral-50/50">
                      <td className="px-4 py-3 text-neutral-700">
                        <span className="flex items-center gap-1.5 pl-4">
                          <ChevronRight className="h-3 w-3 text-neutral-400 shrink-0" />
                          {child.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">{child.slug}</td>
                      <td className="px-4 py-3 text-neutral-500">{child.description ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(child.id, child.name)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
