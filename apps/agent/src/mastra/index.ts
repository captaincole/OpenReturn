import "dotenv/config";
import { Mastra } from "@mastra/core";
import { ConsoleLogger } from "./server/consoleLogger";
import { luca } from "./agents/luca";
import { reviewDecisionWorkflow } from "./workflows/reviewDecision";
import { corsMiddleware } from "./server/cors";
import { createObservability } from "./server/observability";
import { appStateRoute } from "./server/routes/appState";
import { createFilingRoute } from "./server/routes/createFiling";
import { deleteFilingRoute } from "./server/routes/deleteFiling";
import { sessionResetRoute } from "./server/routes/sessionReset";
import { createStorage } from "./server/storage";
import { ownerMiddleware } from "./server/ownerMiddleware";

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
   * The app has exactly ONE agent. The review-decision judges are
   * workflow internals (workflows/reviewDecision/judges/) and are
   * deliberately NOT registered. Registration would expose them as
   * chattable agents in Studio and the public API.
   */
  agents: { luca },
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
