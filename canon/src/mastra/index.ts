import { Mastra } from "@mastra/core";
import "dotenv/config";
import { canonMcp } from "./mcp";
import { ConsoleLogger } from "./server/consoleLogger";
import { corsMiddleware } from "./server/cors";
import { createObservability } from "./server/observability";
import { listRefDocsRoute, refDocHtmlRoute, refDocPdfRoute } from "./server/routes/refdocs";
import { createStorage } from "./server/storage";
import { askWorkflow } from "./workflows/ask";
import { askAnswerer } from "./workflows/ask/judges/askAnswerer";
import { askQueryFormulator } from "./workflows/ask/judges/askQueryFormulator";
import { assessRiskAgent } from "./workflows/ground/judges/assessRiskAgent";
import { queryFormulator } from "./workflows/ground/judges/queryFormulator";
import { ruleAgent } from "./workflows/ground/judges/ruleAgent";

/*
 * Canon, the tax attorney. A Mastra project with no conversational agent
 * and no user data: five narrow judges, the Ask The Tax Code workflow,
 * the reference-library routes the web app reads, and the MCP server
 * (mcp.ts) that is its contract with Cade and the engine builder.
 *
 * Port 4112 (Cade is 4111). CANON_PORT overrides it.
 */

const storage = await createStorage();

/* Hoisted so the onError hook routes uncaught throws through the app logger. */
const logger = new ConsoleLogger({ name: "canon", level: "info" });

export const mastra = new Mastra({
  agents: { askQueryFormulator, askAnswerer, queryFormulator, assessRiskAgent, ruleAgent },
  workflows: { ask: askWorkflow },
  mcpServers: { canon: canonMcp },
  storage,
  logger,
  observability: createObservability(),
  server: {
    port: Number(process.env.CANON_PORT ?? 4112),
    /*
     * Mastra wraps every route handler in its own try/catch before any
     * middleware runs; an uncaught throw funnels through this hook.
     * Without it Mastra returns a generic 500 with zero logging.
     */
    onError: (err, c) => {
      logger.error("unhandled handler error", {
        method: c.req.method,
        path: c.req.path,
        err,
      });
      return c.json({ error: "internal server error" }, 500);
    },
    /*
     * CORS only. Corpus data is shared reference material, not user data;
     * the web app's proxy is what sits in front of this port.
     */
    middleware: [corsMiddleware],
    apiRoutes: [listRefDocsRoute, refDocPdfRoute, refDocHtmlRoute],
  },
});
