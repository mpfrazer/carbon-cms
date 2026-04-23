import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { complete, stripHtml } from "@/lib/ai-client";
import { buildPrompt } from "@/lib/ai-prompts";
import { ok, badRequest, serverError } from "@/lib/api/response";

const bodySchema = z.object({
  task: z.enum(["test", "excerpt", "seo", "tags", "category", "titles", "outline", "improve", "category-description"]),
  ctx: z.record(z.string(), z.string()).default({}),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

    const { task, ctx } = parsed.data;

    const cleanCtx = { ...ctx };
    if (cleanCtx.content) cleanCtx.content = stripHtml(cleanCtx.content);

    const { system, user } = buildPrompt(task, cleanCtx);
    const result = await complete(user, system, task === "outline" ? 2048 : 1024);

    return ok({ result });
  } catch (e) {
    if (e instanceof Error && e.message === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI is not configured. Add your provider settings under Settings → AI." }, { status: 503 });
    }
    return serverError(e);
  }
}
