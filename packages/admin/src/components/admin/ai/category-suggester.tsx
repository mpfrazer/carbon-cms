"use client";

import { AiButton } from "./ai-button";
import { useAi } from "./use-ai";

interface CategorySuggesterProps {
  title: string;
  content: string;
  allCategories: { id: string; name: string }[];
  selectedCategoryIds: string[];
  onSelected: (categoryIds: string[]) => void;
}

export function CategorySuggester({ title, content, allCategories, selectedCategoryIds, onSelected }: CategorySuggesterProps) {
  const { loading, error, runJson } = useAi();

  async function suggest() {
    if (!title || allCategories.length === 0) return;
    const categoryList = allCategories.map((c) => c.name).join("\n");
    const result = await runJson<string[]>("category", { title, content, categories: categoryList });
    if (!result) return;

    const suggested = result
      .map((name) => allCategories.find((c) => c.name.toLowerCase() === name.toLowerCase()))
      .filter(Boolean)
      .map((c) => c!.id);

    const merged = Array.from(new Set([...selectedCategoryIds, ...suggested]));
    onSelected(merged);
  }

  return (
    <div className="flex items-center gap-2">
      <AiButton onClick={suggest} loading={loading} label="AI Suggest" />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
