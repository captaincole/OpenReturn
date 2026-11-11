import { MASTRA_RESOURCE_ID_KEY, RequestContext } from "@mastra/core/request-context";
import { createOwnerFiling } from "../../src/mastra/db/filings";
import { DEMO_TAX_YEAR } from "../../src/mastra/server/demoSession";
import { REQUEST_CONTEXT_KEYS } from "../../src/mastra/server/requestContext";

let runCounter = 0;

/* A new owner and filing for one run, in the temp database (import lib/tempDb first). */
export async function freshScope() {
  const userId = `eval-${++runCounter}`;
  const filingId = crypto.randomUUID();
  await createOwnerFiling({ filingId, userId, taxYear: DEMO_TAX_YEAR });
  /* What ownerMiddleware sets on a real request; the tools' requestContextSchema requires the last two. */
  const requestContext = new RequestContext();
  requestContext.set(MASTRA_RESOURCE_ID_KEY, userId);
  requestContext.set(REQUEST_CONTEXT_KEYS.userId, userId);
  requestContext.set(REQUEST_CONTEXT_KEYS.userEmail, `${userId}@example.com`);
  return { scope: { userId, filingId }, requestContext };
}
