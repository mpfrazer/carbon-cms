"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Plus, ExternalLink, Link as LinkIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type NavPageItem = { id: string; type: "page"; pageId: string; label: string };
export type NavLinkItem = { id: string; type: "link"; label: string; url: string };
export type NavItem = NavPageItem | NavLinkItem;

interface PoolPage { id: string; title: string; slug: string; }

interface NavEditorProps {
  initialNavItems: NavItem[];
  allPages: PoolPage[];
}

// ── Sortable nav item (right column) ─────────────────────────────────────────

function SortableNavItem({
  item,
  onRemove,
  onLabelChange,
}: {
  item: NavItem;
  onRemove: () => void;
  onLabelChange: (label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 shadow-sm">
      <button type="button" {...listeners} {...attributes} className="cursor-grab touch-none text-neutral-300 hover:text-neutral-500 transition-colors shrink-0">
        <GripVertical className="h-4 w-4" />
      </button>
      {item.type === "link" && <LinkIcon className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      <input
        type="text"
        value={item.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm text-neutral-800 focus:outline-none"
        placeholder="Label"
      />
      {item.type === "link" && (
        <span className="truncate max-w-[120px] text-xs text-neutral-400">{item.url}</span>
      )}
      {item.type === "page" && (
        <span className="text-xs text-neutral-400 shrink-0">/{(item as NavPageItem & { slug?: string }).slug ?? ""}</span>
      )}
      <button type="button" onClick={onRemove} className="shrink-0 text-neutral-300 hover:text-red-500 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Drag overlay tile (shown while dragging)
function DragTile({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2.5 shadow-lg opacity-90">
      <GripVertical className="h-4 w-4 text-neutral-400" />
      <span className="text-sm text-neutral-800">{label}</span>
    </div>
  );
}

// ── Pool page tile (left column) ──────────────────────────────────────────────

function PoolTile({ page, onAdd }: { page: PoolPage; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex w-full items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
    >
      <span className="truncate">{page.title}</span>
      <Plus className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-600 transition-colors shrink-0 ml-2" />
    </button>
  );
}

// ── Nav droppable container ───────────────────────────────────────────────────

function NavDropZone({ children, isEmpty }: { children: React.ReactNode; isEmpty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "nav-drop" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] space-y-2 rounded-lg transition-colors ${isOver ? "bg-neutral-100 dark:bg-neutral-700/50" : ""} ${isEmpty ? "flex items-center justify-center" : ""}`}
    >
      {isEmpty ? (
        <p className="text-sm text-neutral-400 pointer-events-none">
          {isOver ? "Release to add" : "Drag pages here or click + to add"}
        </p>
      ) : children}
    </div>
  );
}

// ── Pool droppable container (accepts nav items dropped back) ─────────────────

function PoolDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool-drop" });
  return (
    <div ref={setNodeRef} className={`space-y-2 rounded-lg transition-colors ${isOver ? "bg-neutral-100 dark:bg-neutral-700/50 p-1" : ""}`}>
      {children}
    </div>
  );
}

// ── Custom link form ──────────────────────────────────────────────────────────

function AddLinkForm({ onAdd, onCancel }: { onAdd: (label: string, url: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const inputClass = "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    onAdd(label.trim(), url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-3 space-y-2">
      <input autoFocus type="text" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
      <input type="url" placeholder="URL (https://… or /path)" value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} required />
      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 transition-colors">Add link</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 dark:border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 transition-colors">Cancel</button>
      </div>
    </form>
  );
}

// ── Main NavEditor ────────────────────────────────────────────────────────────

export function NavEditor({ initialNavItems, allPages }: NavEditorProps) {
  const [navItems, setNavItems] = useState<NavItem[]>(initialNavItems);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const snapshotRef = useRef<NavItem[]>(initialNavItems);

  // Build page slug lookup for display in nav items
  const pageSlugMap = Object.fromEntries(allPages.map((p) => [p.id, p.slug]));

  // Derive pool: pages not currently in nav
  const navPageIds = new Set(navItems.filter((n) => n.type === "page").map((n) => (n as NavPageItem).pageId));
  const poolPages = allPages.filter((p) => !navPageIds.has(p.id));

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function markDirty<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: React.SetStateAction<T>) {
    setter(value);
    setIsDirty(true);
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
    snapshotRef.current = navItems;
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveInNav = navItems.some((n) => n.id === activeId);
    const isOverNav = overId === "nav-drop" || navItems.some((n) => n.id === overId);
    const isOverPool = overId === "pool-drop" || poolPages.some((p) => p.id === overId);

    if (!isActiveInNav && isOverNav) {
      // Pool → Nav: insert at position
      const page = poolPages.find((p) => p.id === activeId);
      if (!page) return;

      setNavItems((prev) => {
        if (prev.some((n) => n.id === activeId)) return prev; // guard
        const newItem: NavItem = { id: page.id, type: "page", pageId: page.id, label: page.title };
        const overIndex = prev.findIndex((n) => n.id === overId);
        const result = [...prev];
        result.splice(overIndex >= 0 ? overIndex : result.length, 0, newItem);
        return result;
      });
    } else if (isActiveInNav && isOverPool) {
      // Nav → Pool: remove from nav
      setNavItems((prev) => prev.filter((n) => n.id !== activeId));
    } else if (isActiveInNav && isOverNav) {
      // Reorder within nav
      const oldIndex = navItems.findIndex((n) => n.id === activeId);
      const newIndex = navItems.findIndex((n) => n.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setNavItems((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) {
      setNavItems(snapshotRef.current); // revert if dropped nowhere
      return;
    }
    setIsDirty(true);
  }

  // ── Pool add by click ───────────────────────────────────────────────────────

  function addPageToNav(page: PoolPage) {
    const newItem: NavItem = { id: page.id, type: "page", pageId: page.id, label: page.title };
    markDirty(setNavItems, (prev) => [...prev, newItem]);
  }

  function addCustomLink(label: string, url: string) {
    const id = `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: NavItem = { id, type: "link", label, url };
    markDirty(setNavItems, (prev) => [...prev, newItem]);
    setShowLinkForm(false);
  }

  function removeNavItem(id: string) {
    markDirty(setNavItems, (prev) => prev.filter((n) => n.id !== id));
  }

  function updateLabel(id: string, label: string) {
    markDirty(setNavItems, (prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    // Strip internal `slug` augmentation before persisting
    const toSave = navItems.map(({ ...item }) => item);
    const res = await fetch("/api/v1/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navMenu: toSave }),
    });
    setSaving(false);
    if (res.ok) {
      setIsDirty(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    }
  }

  // ── Active item for drag overlay ────────────────────────────────────────────
  const activeNavItem = activeId ? navItems.find((n) => n.id === activeId) : null;
  const activePoolPage = activeId ? poolPages.find((p) => p.id === activeId) : null;
  const activeLabel = activeNavItem?.label ?? activePoolPage?.title ?? "";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          {isDirty && (
            <p className="text-sm text-amber-600 font-medium">You have unsaved changes.</p>
          )}
          {savedMessage && !isDirty && (
            <p className="text-sm text-green-600 font-medium">Nav menu saved.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save nav menu"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: available pages pool */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Available pages</h2>
          <PoolDropZone>
            {poolPages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700 py-8 text-center text-sm text-neutral-400">
                All published pages are in the nav.
              </p>
            ) : (
              poolPages.map((page) => (
                <PoolTile key={page.id} page={page} onAdd={() => addPageToNav(page)} />
              ))
            )}
          </PoolDropZone>

          <div className="mt-4">
            {showLinkForm ? (
              <AddLinkForm onAdd={addCustomLink} onCancel={() => setShowLinkForm(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setShowLinkForm(true)}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Add custom link
              </button>
            )}
          </div>
        </div>

        {/* Right: current nav */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Navigation menu
            <span className="ml-2 text-xs font-normal text-neutral-400">drag to reorder</span>
          </h2>
          <SortableContext items={navItems.map((n) => n.id)} strategy={verticalListSortingStrategy}>
            <NavDropZone isEmpty={navItems.length === 0}>
              {navItems.map((item) => (
                <SortableNavItem
                  key={item.id}
                  item={{ ...item, ...(item.type === "page" ? { slug: pageSlugMap[item.pageId] } : {}) } as NavItem & { slug?: string }}
                  onRemove={() => removeNavItem(item.id)}
                  onLabelChange={(label) => updateLabel(item.id, label)}
                />
              ))}
            </NavDropZone>
          </SortableContext>
        </div>
      </div>

      <DragOverlay>
        {activeLabel ? <DragTile label={activeLabel} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
