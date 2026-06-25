import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { extractApiKeyToken, validateApiKey } from "@/lib/api-key";
import { createMcpServerForScopes } from "@/lib/mcp";

/**
 * Built-in MCP endpoint. Streamable HTTP transport, stateless mode, JSON
 * responses (not SSE) for v1 simplicity — tools today return small text
 * payloads and don't need streaming. Per-request McpServer instance is
 * built with only the tools the calling key has scopes for.
 *
 * Auth: Bearer API key in the Authorization header (same csk_ tokens as
 * the REST API). No-key and invalid-key requests get 401. Reads require
 * a key too — no anonymous AI traffic, per the architecture doc.
 *
 * See docs/architecture/mcp-server.md for the design rationale and
 * docs/integrations/mcp.md for the client-config snippet.
 */
export async function POST(req: NextRequest) {
  const token = extractApiKeyToken(req.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Authentication required" }, id: null },
      { status: 401 },
    );
  }

  const key = await validateApiKey(token);
  if (!key) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Invalid API key" }, id: null },
      { status: 401 },
    );
  }

  const server = createMcpServerForScopes(key.scopes);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}
