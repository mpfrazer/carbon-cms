"use client";

import { AiButton } from "./ai-button";
import { useAi } from "./use-ai";

interface OutlineGeneratorProps {
  title: string;
  notes?: string;
  onGenerated: (html: string) => void;
}

export function OutlineGenerator({ title, notes, onGenerated }: OutlineGeneratorProps) {
  const { loading, error, run } = useAi();

  async function generate() {
    if (!title) return;
    const result = await run("outline", { title, notes: notes ?? "" });
    if (result) onGenerated(result.trim());
  }

  return (
    <div className="flex items-center gap-2">
      <AiButton onClick={generate} loading={loading} label="Generate outline" />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
