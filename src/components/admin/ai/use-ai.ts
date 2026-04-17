"use client";

import { useState } from "react";
import { extractJson } from "@/lib/ai-client";

type AiTask = "test" | "excerpt" | "seo" | "tags" | "category" | "titles" | "outline" | "improve" | "category-description";

export function useAi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(task: AiTask, ctx: Record<string, string>): Promise<string | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, ctx }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "AI request failed");
        return null;
      }
      return json.result as string;
    } catch {
      setError("Network error");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function runJson<T>(task: AiTask, ctx: Record<string, string>): Promise<T | null> {
    const raw = await run(task, ctx);
    if (raw === null) return null;
    try {
      return JSON.parse(extractJson(raw)) as T;
    } catch {
      setError("AI returned unexpected output. Please try again.");
      return null;
    }
  }

  return { loading, error, run, runJson };
}
