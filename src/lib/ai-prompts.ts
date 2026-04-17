/** All AI prompt templates. Edit here to tune model behaviour. */

export type AiTask =
  | "test"
  | "excerpt"
  | "seo"
  | "tags"
  | "category"
  | "titles"
  | "outline"
  | "improve"
  | "category-description";

export type AiContext = Record<string, string>;

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(task: AiTask, ctx: AiContext): BuiltPrompt {
  switch (task) {
    case "test":
      return {
        system: "You are a helpful assistant.",
        user: 'Respond with exactly the word "ok" and nothing else.',
      };

    case "excerpt":
      return {
        system:
          "You are a skilled content editor. Respond with only the excerpt text — no quotes, labels, or explanation.",
        user: `Write a compelling excerpt for a blog post. Keep it to 1–2 sentences and under 280 characters. Focus on what the reader will learn or gain.

Post title: ${ctx.title}

Post content:
${ctx.content}`,
      };

    case "seo":
      return {
        system:
          "You are an SEO expert. Respond with ONLY a valid JSON object — no explanation, no code fences.",
        user: `Generate an SEO-optimized meta title and description for this content.

Requirements:
- metaTitle: 50–60 characters, primary keyword near the start, compelling
- metaDescription: 150–160 characters, include a benefit or call-to-action, no keyword stuffing

Title: ${ctx.title}
Content summary: ${ctx.content}
${ctx.currentMetaTitle ? `Current meta title: ${ctx.currentMetaTitle}` : ""}
${ctx.currentMetaDescription ? `Current meta description: ${ctx.currentMetaDescription}` : ""}

Respond with exactly: {"metaTitle":"...","metaDescription":"..."}`,
      };

    case "tags":
      return {
        system:
          "You are a content categorization expert. Respond with ONLY a valid JSON array of strings — no explanation.",
        user: `Suggest the most relevant tags for this blog post.

Post title: ${ctx.title}
Post content: ${ctx.content}

Existing tags in the system: ${ctx.existingTags || "(none yet)"}

Rules:
- Prefer tags from the existing list when they fit
- You may suggest up to 2 new tags if important ones are genuinely missing
- Return 3–6 tags total, lower is better if fewer apply
- Respond with exactly: ["tag one","tag two","tag three"]`,
      };

    case "category":
      return {
        system:
          "You are a content categorization expert. Respond with ONLY a valid JSON array of category names — no explanation.",
        user: `Which categories best fit this blog post?

Post title: ${ctx.title}
Post content: ${ctx.content}

Available categories:
${ctx.categories || "(none)"}

Rules:
- Select 1–2 of the most relevant categories
- Only use names exactly as they appear in the available list
- Respond with exactly: ["Category Name"]`,
      };

    case "titles":
      return {
        system:
          "You are a creative content writer. Respond with ONLY a valid JSON array of exactly 5 strings — no explanation.",
        user: `Generate 5 alternative title options for this blog post.

Current title: ${ctx.currentTitle}
Content summary: ${ctx.content}

Requirements:
- Mix of styles: direct statement, question, list/how-to, benefit-focused, curiosity-driven
- Each title under 70 characters
- Engaging without being clickbait
- Respond with exactly: ["Title 1","Title 2","Title 3","Title 4","Title 5"]`,
      };

    case "outline":
      return {
        system:
          "You are a content strategist. Respond with only valid HTML using only h2, h3, p, ul, and li tags.",
        user: `Create a structured blog post outline for the title: "${ctx.title}"
${ctx.notes ? `\nTopic notes: ${ctx.notes}` : ""}

Generate an outline with:
- A brief intro paragraph placeholder
- 3–5 main sections as <h2> headings
- Sub-points as <h3> or <ul><li> where appropriate
- A conclusion placeholder

Use only HTML tags: <h2>, <h3>, <p>, <ul>, <li>. No other tags.`,
      };

    case "improve": {
      const actions: Record<string, string> = {
        improve: "Improve the writing quality while preserving meaning and tone.",
        shorten: "Make this more concise while preserving all key information.",
        lengthen: "Expand this with more detail, depth, and supporting points.",
        grammar: "Fix all grammar, spelling, and punctuation errors.",
        "tone-professional": "Rewrite in a professional, formal tone.",
        "tone-casual": "Rewrite in a casual, conversational tone.",
        "tone-friendly": "Rewrite in a warm, friendly, approachable tone.",
        "tone-authoritative": "Rewrite in a confident, authoritative tone.",
      };
      const instruction = actions[ctx.action] ?? actions.improve;
      return {
        system:
          "You are an expert editor. Respond with ONLY the revised text — no explanation, no quotes, no labels.",
        user: `${instruction}

${ctx.context ? `Surrounding context (do not rewrite this):\n"${ctx.context}"\n` : ""}
Text to rewrite:
"${ctx.selectedText}"`,
      };
    }

    case "category-description":
      return {
        system:
          "You are a content strategist. Respond with only the description text — no quotes or labels.",
        user: `Write a brief, clear description (1–2 sentences) for a blog category named "${ctx.name}"${
          ctx.parent ? `, which is a subcategory of "${ctx.parent}"` : ""
        }. Describe what types of content belong in this category.`,
      };

    default:
      return { system: "", user: "" };
  }
}
