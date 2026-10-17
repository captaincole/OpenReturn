import { Mastra } from "@mastra/core";
import "dotenv/config";
import { luca } from "./agents/luca";
import { ConsoleLogger } from "./server/consoleLogger";
import { corsMiddleware } from "./server/cors";
import { createObservability } from "./server/observability";
import { ownerMiddleware } from "./server/ownerMiddleware";
import { appStateRoute } from "./server/routes/appState";
import { createFilingRoute } from "./server/routes/createFiling";
import { deleteFilingRoute } from "./server/routes/deleteFiling";
import { sessionResetRoute } from "./server/routes/sessionReset";
import { createStorage } from "./server/storage";
import { reviewDecisionWorkflow } from "./workflows/reviewDecision";
import { assessRiskAgent } from "./workflows/reviewDecision/judges/assessRiskAgent";
import { queryFormulator } from "./workflows/reviewDecision/judges/queryFormulator";
import { ruleAgent } from "./workflows/reviewDecision/judges/ruleAgent";

const storage = await createStorage();

/*
 * Hoisted so the onError hook below can route uncaught throws through
 * the same logger as the rest of the app. Mastra's Hono integration does
 * not `logger.error()` unhandled handler exceptions before it returns
 * 500, which would otherwise hide the failure in prod.
 */
const logger = new ConsoleLogger({ name: "summa", level: "info" });

export const mastra = new Mastra({
  /*
   * Luca is the one conversational agent. The three review-decision
   * judges (workflows/reviewDecision/judges/) are registered too, as the
   * Mastra workflow docs show: the steps get them with mastra.getAgent(),
   * so their calls share the app's logger and traces. Studio lists them.
   */
  agents: { luca, queryFormulator, assessRiskAgent, ruleAgent },
  workflows: { reviewDecision: reviewDecisionWorkflow },
  storage,
  logger,
  observability: createObservability(),
  /*
   * Self-host: `mastra build` emits a plain Node server (.mastra/output)
   * and `npm start` runs it. No platform deployer.
   */
  server: {
    /*
     * Single-user model: no per-request auth provider. The web app fronts
     * the agent (session cookie + server-side proxy). ownerMiddleware
     * resolves the instance owner and optionally enforces AGENT_API_TOKEN
     * for deployments where this port is reachable beyond localhost.
     *
     * Mastra wraps every route handler in its own try/catch before any
     * server.middleware runs, so an uncaught throw never reaches the
     * middleware; it funnels through this hook instead. Without onError,
     * Mastra returns a generic 500 with zero logging — the failure mode
     * that originally hid the 8949 catalog ENOENT in prod.
     */
    onError: (err, c) => {
      logger.error("unhandled handler error", {
        method: c.req.method,
        path: c.req.path,
        err,
      });
      return c.json({ error: "internal server error" }, 500);
    },
    middleware: [
      /*
       * CORS first, so cross-origin preflights short-circuit before
       * everything else. The ALLOWED_ORIGINS env var configures it;
       * permissive when unset.
       */
      corsMiddleware,
      /*
       * Optional AGENT_API_TOKEN gate. Also resolves the instance owner
       * onto requestContext (resource id for memory scoping, email for
       * the engine's authEmail enrichment).
       */
      ownerMiddleware,
    ],
    apiRoutes: [appStateRoute, createFilingRoute, deleteFilingRoute, sessionResetRoute],
  },
});
