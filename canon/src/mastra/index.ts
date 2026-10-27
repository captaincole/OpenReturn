import { Mastra } from "@mastra/core";
import "dotenv/config";
import { canonMcp } from "./mcp";
import { ConsoleLogger } from "./server/consoleLogger";
import { createObservability } from "./server/observability";
import { requestGuard } from "./server/requestGuard";
import { listRefDocsRoute, refDocHtmlRoute, refDocPdfRoute } from "./server/routes/refdocs";
import { createStorage } from "./server/storage";
import { keepServingAfterClientLeft } from "./server/streamGuard";
import { tokenGate } from "./server/tokenGate";
import { askWorkflow } from "./workflows/ask";
import { askAnswerer } from "./workflows/ask/judges/askAnswerer";
import { askQueryFormulator } from "./workflows/ask/judges/askQueryFormulator";
import { groundWorkflow } from "./workflows/ground";
import { assessRiskAgent } from "./workflows/ground/judges/assessRiskAgent";
import { queryFormulator } from "./workflows/ground/judges/queryFormulator";
import { ruleAgent } from "./workflows/ground/judges/ruleAgent";

/*
 * Canon, the tax attorney. A Mastra project with no conversational agent
 * and no user data: five narrow judges, the Ask The Tax Code and ground
 * workflows, the reference-library routes the web app reads, and the
 * MCP server (mcp.ts) that is its contract with Cade and the engine
 * builder.
 *
 * Port 4112 (Cade is 4111). CANON_PORT overrides it.
 */

const storage = await createStorage();

/* Hoisted so the onError hook routes uncaught throws through the app logger. */
const logger = new ConsoleLogger({ name: "canon", level: "info" });
keepServingAfterClientLeft(logger);

export const mastra = new Mastra({
  agents: { askQueryFormulator, askAnswerer, queryFormulator, assessRiskAgent, ruleAgent },
  workflows: { ask: askWorkflow, ground: groundWorkflow },
  mcpServers: { canon: canonMcp },
  storage,
  logger,
  observability: createObservability(),
  server: {
    port: Number(process.env.CANON_PORT ?? 4112),
    /* Loopback only, as Cade (its index.ts says why). MASTRA_HOST opens it wider. */
    host: process.env.MASTRA_HOST ?? "127.0.0.1",
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
    /* No CORS, as Cade: browsers reach Canon only through the web app's proxy. */
    cors: false,
    /*
     * No user auth: corpus data is shared reference material, and the web
     * app's proxy is what sits in front of this port. requestGuard refuses
     * foreign Origin and Host headers. The token gate is the optional
     * defense in depth when the port is reachable beyond localhost
     * (CANON_API_TOKEN, same shape as Cade's AGENT_API_TOKEN).
     */
    middleware: [requestGuard, tokenGate],
    apiRoutes: [listRefDocsRoute, refDocPdfRoute, refDocHtmlRoute],
  },
});
