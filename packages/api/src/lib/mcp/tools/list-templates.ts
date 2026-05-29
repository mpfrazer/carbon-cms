import { z } from "zod";
import type { CarbonMcpTool } from "../registry";
import { textResult } from "../registry";
import {
  listTemplates,
  listContributedTemplates,
  getActiveThemeId,
} from "@/lib/templates";

export const listTemplatesTool = {
  name: "list_templates",
  title: "List post templates",
  description:
    "List every post template available on this Carbon site — built-ins (article, recipe) plus any templates contributed by the currently active theme (e.g. book-review). Use this before calling create_post or any template-aware authoring tool, so you know which kinds exist and what fields they accept.",
  inputSchema: {
    include_schema: z
      .boolean()
      .optional()
      .describe(
        "If true, include each template's JSON Schema so you can see the structuredData fields. Defaults to false (kind + label only).",
      ),
  },
  requiredScopes: ["content:read"] as const,
  handler: async (args) => {
    const include_schema = args.include_schema === true;
    const builtins = listTemplates().map((t) => {
      const base: Record<string, unknown> = {
        kind: t.kind,
        label: t.label,
        description: t.description ?? null,
        source: "builtin",
      };
      if (include_schema) base.schema = z.toJSONSchema(t.schema);
      return base;
    });

    let contributed: Array<Record<string, unknown>> = [];
    try {
      const activeTheme = await getActiveThemeId();
      const contributedList = await listContributedTemplates(activeTheme);
      const builtinKinds = new Set(builtins.map((b) => b.kind as string));
      contributed = contributedList
        .filter((c) => !builtinKinds.has(c.kind))
        .map((c) => {
          const base: Record<string, unknown> = {
            kind: c.kind,
            label: c.label,
            description: c.description,
            source: "theme",
            themeId: c.themeId,
          };
          if (include_schema) base.schema = c.jsonSchema;
          return base;
        });
    } catch {
      // DB unreachable — return built-ins only. Same defensive pattern as
      // validateStructuredData in lib/templates/index.ts.
    }

    const all = [...builtins, ...contributed];
    return textResult(JSON.stringify(all, null, 2));
  },
} satisfies CarbonMcpTool;
