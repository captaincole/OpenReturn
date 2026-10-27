import { Mastra } from "@mastra/core";
import "dotenv/config";
import { cade } from "./agents/cade";
import { ConsoleLogger } from "./server/consoleLogger";
import { createObservability } from "./server/observability";
import { ownerMiddleware } from "./server/ownerMiddleware";
import { requestGuard } from "./server/requestGuard";
import { appStateRoute } from "./server/routes/appState";
import { addAskTurnRoute, createAskRoute, getAskThreadRoute } from "./server/routes/ask";
import { createFilingRoute } from "./server/routes/createFiling";
import { deleteFilingRoute } from "./server/routes/deleteFiling";
import { retryReviewsRoute } from "./server/routes/retryReviews";
import { sessionResetRoute } from "./server/routes/sessionReset";
import { createStorage } from "./server/storage";
import { reviewDecisionWorkflow } from "./workflows/reviewDecision";

const storage = await createStorage();

/*
 * Hoisted so the onError hook below can route uncaught throws through
 * the same logger as the rest of the app. Mastra's Hono integration does
 * not `logger.error()` unhandled handler exceptions before it returns
 * 500, which would otherwise hide the failure in prod.
 */
const logger = new ConsoleLogger({ name: "openreturn", level: "info" });

export const mastra = new Mastra({
  /*
   * Cade is the one agent. Grounding and tax-code answers come from
   * Canon over MCP (canon/client.ts); its judges run in Canon's process.
   */
  agents: { cade },
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
     * Loopback only. Mastra leaves the bind address to Node when no host
     * is set, and Node then listens on every interface. The web app's
     * proxy reaches the agent at 127.0.0.1; MASTRA_HOST opens it wider.
     */
    host: process.env.MASTRA_HOST ?? "127.0.0.1",
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
    /*
     * No CORS: the browser never calls the agent, so no other origin may
     * read its responses. Without this, Mastra answers every origin with
     * Access-Control-Allow-Origin: *.
     */
    cors: false,
    middleware: [
      /* Refuse foreign Origin and Host headers first (requestGuard.ts). */
      requestGuard,
      /*
       * Optional AGENT_API_TOKEN gate. Also resolves the instance owner
       * onto requestContext (resource id for memory scoping, email for
       * the engine's authEmail enrichment).
       */
      ownerMiddleware,
    ],
    apiRoutes: [
      appStateRoute,
      createFilingRoute,
      deleteFilingRoute,
      retryReviewsRoute,
      sessionResetRoute,
      createAskRoute,
      addAskTurnRoute,
      getAskThreadRoute,
    ],
  },
});
