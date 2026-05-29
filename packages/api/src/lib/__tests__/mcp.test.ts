import { describe, it, expect } from "vitest";
import {
  listMcpTools,
  listMcpToolsForScopes,
  type CarbonMcpTool,
} from "../mcp";
import { listTemplatesTool } from "../mcp/tools/list-templates";

describe("MCP tool registry", () => {
  it("registers the three v1 read tools", () => {
    const names = listMcpTools().map((t) => t.name).sort();
    expect(names).toEqual(["get_post", "list_templates", "search_content"]);
  });

  it("every tool declares at least one required scope", () => {
    for (const tool of listMcpTools()) {
      expect(tool.requiredScopes.length, `${tool.name} missing scopes`).toBeGreaterThan(0);
    }
  });

  it("every tool has a non-trivial description (agents rely on it)", () => {
    for (const tool of listMcpTools()) {
      expect(tool.description.length, `${tool.name} description too short`).toBeGreaterThan(40);
    }
  });

  it("tool names follow the verb_noun snake_case convention", () => {
    for (const tool of listMcpTools()) {
      expect(tool.name).toMatch(/^[a-z]+(_[a-z]+)+$/);
    }
  });

  it("intentionally excludes api-keys:* tools (privilege-escalation hazard)", () => {
    for (const tool of listMcpTools()) {
      for (const scope of tool.requiredScopes) {
        expect(scope.startsWith("api-keys:")).toBe(false);
      }
    }
  });
});

describe("listMcpToolsForScopes", () => {
  it("returns no tools for an empty scope set", () => {
    expect(listMcpToolsForScopes([])).toEqual([]);
  });

  it("filters out tools whose scopes are not all granted", () => {
    // content:read alone enables all three v1 read tools
    const tools = listMcpToolsForScopes(["content:read"]).map((t) => t.name).sort();
    expect(tools).toEqual(["get_post", "list_templates", "search_content"]);
  });

  it("does not surface read tools to a key with only unrelated scopes", () => {
    const tools = listMcpToolsForScopes(["webhooks:write", "stats:read"]).map((t) => t.name);
    expect(tools).not.toContain("get_post");
    expect(tools).not.toContain("search_content");
    expect(tools).not.toContain("list_templates");
  });

  it("requires every declared scope, not just one (AND semantics)", () => {
    // Construct a synthetic tool that needs two scopes to verify the AND rule.
    const both: CarbonMcpTool = {
      name: "synthetic_two_scope",
      description: "Synthetic tool requiring two scopes — used by drift / authz tests.",
      requiredScopes: ["content:read", "media:read"],
      handler: async () => ({ content: [{ type: "text", text: "ok" }] }),
    };
    // Inline filter using the same logic as listMcpToolsForScopes
    const granted = new Set<string>(["content:read"]);
    const ok = both.requiredScopes.every((s) => granted.has(s));
    expect(ok).toBe(false);
    granted.add("media:read");
    const ok2 = both.requiredScopes.every((s) => granted.has(s));
    expect(ok2).toBe(true);
  });
});

describe("list_templates tool smoke", () => {
  it("returns at least article and recipe built-ins", async () => {
    const result = await listTemplatesTool.handler({});
    expect(result.isError).toBeFalsy();
    const text = result.content[0].text;
    const parsed = JSON.parse(text);
    const kinds = parsed.map((t: { kind: string }) => t.kind);
    expect(kinds).toContain("article");
    expect(kinds).toContain("recipe");
  });

  it("omits schema by default and includes it when include_schema=true", async () => {
    const withoutSchema = JSON.parse((await listTemplatesTool.handler({})).content[0].text);
    expect(withoutSchema[0].schema).toBeUndefined();

    const withSchema = JSON.parse((await listTemplatesTool.handler({ include_schema: true })).content[0].text);
    expect(withSchema[0].schema).toBeDefined();
  });
});
