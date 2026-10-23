import { MCPServer } from "@mastra/mcp";
import { citeRefDocTool, searchRefDocsTool } from "./tools/refDocs";
import { askWorkflow } from "./workflows/ask";

/*
 * Canon's public surface. Mastra serves it at /api/mcp/canon/mcp
 * (streamable HTTP) and /api/mcp/canon/sse once the server is registered
 * on the instance (index.ts), so Cade, the engine builder, Claude Code or
 * any MCP client reach the library the same way. The keys below are the
 * tool names (a client namespaces them, e.g. canon_searchRefDocs):
 *
 *   searchRefDocs   hybrid retrieval over the corpus
 *   citeRefDoc      one block's verbatim text and citation
 *   run_ask         Ask The Tax Code (workflows/ask)
 *
 * Grounding a decision (the review judges) joins this list when Cade's
 * review workflow moves to the boundary. Keep the surface this small:
 * everything a consumer needs from the corpus should fit in these tools.
 */
export const canonMcp = new MCPServer({
  id: "canon",
  name: "Canon",
  version: "0.1.0",
  description:
    "The IRS and FTB reference library: search it, cite it, and ask it a tax-code question.",
  tools: { searchRefDocs: searchRefDocsTool, citeRefDoc: citeRefDocTool },
  workflows: { ask: askWorkflow },
});
