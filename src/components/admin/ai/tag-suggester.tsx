"use client";

import { AiButton } from "./ai-button";
import { useAi } from "./use-ai";

interface TagSuggesterProps {
  title: string;
  content: string;
  existingTags: { id: string; name: string }[];
  selectedTagIds: string[];
  onSelected: (tagIds: string[]) => void;
}

export function TagSuggester({ title, content, existingTags, selectedTagIds, onSelected }: TagSuggesterProps) {
  const { loading, error, runJson } = useAi();

  async function suggest() {
    if (!title) return;
    const tagNames = existingTags.map((t) => t.name).join(", ");
    const result = await runJson<string[]>("tags", { title, content, existingTags: tagNames });
    if (!result) return;

    const suggested = result
      .map((name) => existingTags.find((t) => t.name.toLowerCase() === name.toLowerCase()))
      .filter(Boolean)
      .map((t) => t!.id);

    const merged = Array.from(new Set([...selectedTagIds, ...suggested]));
    onSelected(merged);
  }

  return (
    <div className="flex items-center gap-2">
      <AiButton onClick={suggest} loading={loading} label="AI Suggest" />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
