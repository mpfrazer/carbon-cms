import type { z } from "zod";
import type { ApiKeyScope } from "@/lib/api-key";

/**
 * The shape of an MCP tool definition in Carbon's registry. Each tool
 * declares the scopes it requires; the per-request McpServer instance is
 * built with only the tools the calling API key can use, so tools/list
 * automatically filters by scope (the SDK has no concept of authz).
 *
 * Args are passed as Record<string, unknown> — the SDK validates them
 * against `inputSchema` before invoking the handler, so tools can safely
 * cast to their declared input shape inside the body.
 */
export interface CarbonMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: z.ZodRawShape;
  requiredScopes: readonly ApiKeyScope[];
  handler: ToolHandler;
}

/**
 * Standard MCP tool result shape — content blocks the agent receives.
 * Text content covers all v1 tools; image / resource content can come
 * later if a tool needs to return non-text artifacts.
 */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<ToolResult> | ToolResult;

const registry = new Map<string, CarbonMcpTool>();

export function registerMcpTool(tool: CarbonMcpTool): void {
  registry.set(tool.name, tool);
}

export function listMcpTools(): CarbonMcpTool[] {
  return Array.from(registry.values());
}

export function listMcpToolsForScopes(scopes: readonly string[]): CarbonMcpTool[] {
  const scopeSet = new Set<string>(scopes);
  return listMcpTools().filter((tool) =>
    tool.requiredScopes.every((s) => scopeSet.has(s)),
  );
}

/** Convenience: convert a tool result to a successful text-content block. */
export function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

/** Convenience: error result with a single text-content block. */
export function errorResult(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
