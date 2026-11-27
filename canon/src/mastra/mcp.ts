import { MCPServer } from "@mastra/mcp";
import { readLawTool, searchLawTool } from "./tools/law";
import { citeRefDocTool, searchRefDocsTool } from "./tools/refDocs";
import { runWorkflowTool } from "./tools/runWorkflow";
import { askWorkflow } from "./workflows/ask";
import { askRunResultSchema } from "./workflows/ask/types";
import { groundWorkflow } from "./workflows/ground";
import { groundRunResultSchema } from "./workflows/ground/schemas";

/*
 * Canon's public surface, served at /api/mcp/canon/mcp. The keys are the
 * tool names. The workflows are tools with output schemas (tools/runWorkflow.ts)
 * and answer `{ result: <run result> }`. Keep the surface this small.
 */
export const canonMcp = new MCPServer({
  id: "canon",
  name: "Canon",
  version: "0.1.0",
  description:
    "The IRS and FTB reference library: search it, cite it, ask it a tax-code question, and ground a tax decision in it. The law itself (the Internal Revenue Code, the Treasury regulations and California's tax code) is a separate, optional library (searchLaw, readLaw), for when the instructions conflict or do not settle a question.",
  tools: {
    searchRefDocs: searchRefDocsTool,
    citeRefDoc: citeRefDocTool,
    searchLaw: searchLawTool,
    readLaw: readLawTool,
    run_ask: runWorkflowTool(askWorkflow, askRunResultSchema),
    run_ground: runWorkflowTool(groundWorkflow, groundRunResultSchema),
  },
});
