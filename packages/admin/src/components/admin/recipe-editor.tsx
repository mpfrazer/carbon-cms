"use client";

import { useState } from "react";
import { Plus, Trash2, ImageIcon, X, GripVertical } from "lucide-react";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import type { AdminEditorProps } from "@/templates/registry";

interface InstructionStep {
  step: string;
  imageUrl?: string;
}

interface RecipeData {
  panelPlacement: "top" | "bottom";
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: string[];
  instructions: InstructionStep[];
  cuisine?: string;
  course?: string;
  difficulty?: "easy" | "medium" | "hard";
  sourceUrl?: string;
}

function defaults(): RecipeData {
  return {
    panelPlacement: "top",
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    servings: 1,
    ingredients: [""],
    instructions: [{ step: "" }],
  };
}

function coerce(value: Record<string, unknown>): RecipeData {
  const d = defaults();
  const v = value as Partial<RecipeData>;
  return {
    panelPlacement: v.panelPlacement === "bottom" ? "bottom" : "top",
    prepTimeMinutes: typeof v.prepTimeMinutes === "number" ? v.prepTimeMinutes : d.prepTimeMinutes,
    cookTimeMinutes: typeof v.cookTimeMinutes === "number" ? v.cookTimeMinutes : d.cookTimeMinutes,
    servings: typeof v.servings === "number" ? v.servings : d.servings,
    ingredients: Array.isArray(v.ingredients) && v.ingredients.length > 0 ? v.ingredients : d.ingredients,
    instructions: Array.isArray(v.instructions) && v.instructions.length > 0 ? v.instructions : d.instructions,
    cuisine: v.cuisine,
    course: v.course,
    difficulty: v.difficulty,
    sourceUrl: v.sourceUrl,
  };
}

const inputClass = "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

export function RecipeEditor({ value, onChange }: AdminEditorProps) {
  const data = coerce(value);
  const [mediaPickerFor, setMediaPickerFor] = useState<number | null>(null);

  function update<K extends keyof RecipeData>(key: K, next: RecipeData[K]) {
    onChange({ ...data, [key]: next });
  }

  function setIngredient(i: number, line: string) {
    const next = [...data.ingredients];
    next[i] = line;
    update("ingredients", next);
  }

  function addIngredient() {
    update("ingredients", [...data.ingredients, ""]);
  }

  function removeIngredient(i: number) {
    if (data.ingredients.length <= 1) return; // keep at least one
    update("ingredients", data.ingredients.filter((_, idx) => idx !== i));
  }

  function setInstructionStep(i: number, step: string) {
    const next = [...data.instructions];
    next[i] = { ...next[i], step };
    update("instructions", next);
  }

  function setInstructionImage(i: number, imageUrl: string | undefined) {
    const next = [...data.instructions];
    next[i] = { ...next[i], imageUrl };
    update("instructions", next);
  }

  function addInstruction() {
    update("instructions", [...data.instructions, { step: "" }]);
  }

  function removeInstruction(i: number) {
    if (data.instructions.length <= 1) return;
    update("instructions", data.instructions.filter((_, idx) => idx !== i));
  }

  function moveInstruction(from: number, dir: -1 | 1) {
    const to = from + dir;
    if (to < 0 || to >= data.instructions.length) return;
    const next = [...data.instructions];
    [next[from], next[to]] = [next[to], next[from]];
    update("instructions", next);
  }

  return (
    <div className="space-y-6 rounded-md border border-neutral-200 dark:border-neutral-700 p-4">
      {/* Times + servings + panel placement */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Prep (min)</label>
          <input
            type="number"
            min={0}
            value={data.prepTimeMinutes}
            onChange={(e) => update("prepTimeMinutes", Math.max(0, parseInt(e.target.value || "0", 10)))}
            className={inputClass + " w-full"}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Cook (min)</label>
          <input
            type="number"
            min={0}
            value={data.cookTimeMinutes}
            onChange={(e) => update("cookTimeMinutes", Math.max(0, parseInt(e.target.value || "0", 10)))}
            className={inputClass + " w-full"}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Servings</label>
          <input
            type="number"
            min={1}
            value={data.servings}
            onChange={(e) => update("servings", Math.max(1, parseInt(e.target.value || "1", 10)))}
            className={inputClass + " w-full"}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Panel</label>
          <select
            value={data.panelPlacement}
            onChange={(e) => update("panelPlacement", e.target.value as "top" | "bottom")}
            className={inputClass + " w-full"}
          >
            <option value="top">Above body</option>
            <option value="bottom">Below body</option>
          </select>
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Ingredients</label>
          <button
            type="button"
            onClick={addIngredient}
            className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {data.ingredients.map((line, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={line}
                onChange={(e) => setIngredient(i, e.target.value)}
                placeholder="2 cups all-purpose flour"
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                disabled={data.ingredients.length <= 1}
                className="rounded p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30"
                title="Remove ingredient"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Instructions</label>
          <button
            type="button"
            onClick={addInstruction}
            className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
          >
            <Plus className="h-3 w-3" /> Add step
          </button>
        </div>
        <div className="space-y-3">
          {data.instructions.map((instr, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex flex-col gap-0.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => moveInstruction(i, -1)}
                  disabled={i === 0}
                  className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                  title="Move up"
                >
                  <GripVertical className="h-4 w-4 rotate-90" />
                </button>
              </div>
              <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 space-y-2">
                <textarea
                  value={instr.step}
                  onChange={(e) => setInstructionStep(i, e.target.value)}
                  placeholder="Describe this step…"
                  rows={2}
                  className={inputClass + " w-full"}
                />
                {instr.imageUrl ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={instr.imageUrl} alt="" className="h-16 w-16 rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => setInstructionImage(i, undefined)}
                      className="text-xs text-neutral-500 hover:text-red-500 inline-flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove image
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMediaPickerFor(i)}
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Add step image
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeInstruction(i)}
                disabled={data.instructions.length <= 1}
                className="rounded p-1.5 text-neutral-400 hover:text-red-500 disabled:opacity-30 mt-0.5"
                title="Remove step"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Optional metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Cuisine (optional)</label>
          <input
            type="text"
            value={data.cuisine ?? ""}
            onChange={(e) => update("cuisine", e.target.value || undefined)}
            placeholder="Italian, Thai, Mexican…"
            className={inputClass + " w-full"}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Course (optional)</label>
          <input
            type="text"
            value={data.course ?? ""}
            onChange={(e) => update("course", e.target.value || undefined)}
            placeholder="Breakfast, Dessert, Main…"
            className={inputClass + " w-full"}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Difficulty (optional)</label>
          <select
            value={data.difficulty ?? ""}
            onChange={(e) => update("difficulty", (e.target.value || undefined) as RecipeData["difficulty"])}
            className={inputClass + " w-full"}
          >
            <option value="">—</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Source URL (optional)</label>
          <input
            type="url"
            value={data.sourceUrl ?? ""}
            onChange={(e) => update("sourceUrl", e.target.value || undefined)}
            placeholder="https://example.com/original-recipe"
            className={inputClass + " w-full"}
          />
        </div>
      </div>

      <MediaPickerModal
        title="Choose step image"
        open={mediaPickerFor !== null}
        onClose={() => setMediaPickerFor(null)}
        onSelect={(item) => {
          if (mediaPickerFor !== null) setInstructionImage(mediaPickerFor, item.url);
          setMediaPickerFor(null);
        }}
        selectedId={null}
      />
    </div>
  );
}
