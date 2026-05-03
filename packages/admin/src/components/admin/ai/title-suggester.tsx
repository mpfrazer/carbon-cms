"use client";

import { useState } from "react";
import { AiButton } from "./ai-button";
import { useAi } from "./use-ai";

interface TitleSuggesterProps {
  currentTitle: string;
  content: string;
  onSelected: (title: string) => void;
}

export function TitleSuggester({ currentTitle, content, onSelected }: TitleSuggesterProps) {
  const { loading, error, runJson } = useAi();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function suggest() {
    if (!currentTitle) return;
    const result = await runJson<string[]>("titles", { currentTitle, content });
    if (result) setSuggestions(result);
  }

  function pick(title: string) {
    onSelected(title);
    setSuggestions([]);
  }

  return (
    <div className="space-y-2">
      <AiButton onClick={suggest} loading={loading} label="Suggest titles" />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {suggestions.length > 0 && (
        <ul className="rounded-md border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-700/50 text-sm">
          {suggestions.map((t, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(t)}
                className="w-full px-3 py-2 text-left text-neutral-800 dark:text-neutral-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-900 dark:hover:text-violet-300 transition-colors"
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
