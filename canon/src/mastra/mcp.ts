import { MCPServer } from "@mastra/mcp";
import { citeRefDocTool, searchRefDocsTool } from "./tools/refDocs";
import { askWorkflow } from "./workflows/ask";
import { groundWorkflow } from "./workflows/ground";

/*
 * Canon's public surface, served at /api/mcp/canon/mcp. The keys are the
 * tool names; Mastra exposes the workflows as run_ask and run_ground. Keep
 * the surface this small.
 */
export const canonMcp = new MCPServer({
  id: "canon",
  name: "Canon",
  version: "0.1.0",
  description:
    "The IRS and FTB reference library: search it, cite it, ask it a tax-code question, and ground a tax decision in it.",
  tools: { searchRefDocs: searchRefDocsTool, citeRefDoc: citeRefDocTool },
  workflows: { ask: askWorkflow, ground: groundWorkflow },
});
