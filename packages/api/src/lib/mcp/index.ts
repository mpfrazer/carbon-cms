import { registerMcpTool } from "./registry";
import { listTemplatesTool } from "./tools/list-templates";
import { getPostTool } from "./tools/get-post";
import { searchContentTool } from "./tools/search-content";

// Built-in MCP tools. Additional tools register via the same pattern and
// land in their own atomic PRs (PR B writes, PR C template-aware, etc.).
registerMcpTool(listTemplatesTool);
registerMcpTool(getPostTool);
registerMcpTool(searchContentTool);

export {
  registerMcpTool,
  listMcpTools,
  listMcpToolsForScopes,
  textResult,
  errorResult,
  type CarbonMcpTool,
  type ToolResult,
  type ToolHandler,
} from "./registry";

export { createMcpServerForScopes } from "./server";
