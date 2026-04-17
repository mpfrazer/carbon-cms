"use client";

import { AiButton } from "./ai-button";
import { useAi } from "./use-ai";

interface ExcerptGeneratorProps {
  title: string;
  content: string;
  onGenerated: (excerpt: string) => void;
}

export function ExcerptGenerator({ title, content, onGenerated }: ExcerptGeneratorProps) {
  const { loading, error, run } = useAi();

  async function generate() {
    if (!title || !content) return;
    const result = await run("excerpt", { title, content });
    if (result) onGenerated(result.trim());
  }

  return (
    <div className="flex items-center gap-2">
      <AiButton onClick={generate} loading={loading} label="AI Generate" />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
