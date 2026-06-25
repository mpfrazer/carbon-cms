import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listMcpToolsForScopes } from "./registry";

/**
 * Builds a fresh McpServer instance with only the tools the caller's API
 * key has scopes for. The SDK has no concept of authz, so per-request
 * instantiation is how Carbon scopes-gates tools/list and tools/call in
 * one place — agents simply never see tools they can't invoke.
 *
 * Cheap by construction (no I/O at registration), so per-request cost is
 * acceptable for v1. If profiling later shows this as a hot path, the
 * server instance can be cached by sorted-scope-key.
 */
export function createMcpServerForScopes(scopes: readonly string[]): McpServer {
  const server = new McpServer(
    { name: "carbon", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  for (const tool of listMcpToolsForScopes(scopes)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        ...(tool.inputSchema && { inputSchema: tool.inputSchema }),
      },
      tool.handler as Parameters<McpServer["registerTool"]>[2],
    );
  }

  return server;
}
