"use client";

import { AiButton } from "./ai-button";
import { useAi } from "./use-ai";

interface SeoOptimizerProps {
  title: string;
  content: string;
  currentMetaTitle: string;
  currentMetaDescription: string;
  onGenerated: (metaTitle: string, metaDescription: string) => void;
}

export function SeoOptimizer({ title, content, currentMetaTitle, currentMetaDescription, onGenerated }: SeoOptimizerProps) {
  const { loading, error, runJson } = useAi();

  async function generate() {
    if (!title) return;
    const result = await runJson<{ metaTitle: string; metaDescription: string }>("seo", {
      title,
      content,
      currentMetaTitle,
      currentMetaDescription,
    });
    if (result?.metaTitle && result?.metaDescription) {
      onGenerated(result.metaTitle, result.metaDescription);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <AiButton onClick={generate} loading={loading} label="AI Optimize" />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
