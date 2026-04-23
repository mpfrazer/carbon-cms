import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

const AI_KEYS = ["aiProvider", "aiBaseUrl", "aiModel", "aiApiKey"];

export interface AiConfig {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  configured: boolean;
}

export async function getAiConfig(): Promise<AiConfig> {
  const rows = await db.select().from(settings).where(inArray(settings.key, AI_KEYS));
  const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const provider = raw.aiProvider || "";
  const apiKey = raw.aiApiKey || "";
  const model = raw.aiModel || "";
  const baseUrl = raw.aiBaseUrl || "";
  const configured = !!provider && !!model && (provider === "ollama" || !!apiKey);

  return { provider, baseUrl, model, apiKey, configured };
}

export async function complete(
  userPrompt: string,
  systemPrompt?: string,
  maxTokens = 1024
): Promise<string> {
  const config = await getAiConfig();

  if (!config.configured) throw new Error("AI_NOT_CONFIGURED");

  if (config.provider === "anthropic") {
    const client = new Anthropic({ apiKey: config.apiKey });
    const message = await client.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  }

  const client = new OpenAI({
    apiKey: config.apiKey || "ollama",
    baseURL: config.baseUrl || "https://api.openai.com/v1",
  });

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: maxTokens,
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user" as const, content: userPrompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "";
}

export { stripHtml, extractJson } from "@/lib/ai-utils";
