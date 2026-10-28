import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import type { Scope } from "../db/appDb";
import { resolveOwnerFilingForYear } from "../db/filings";
import { DEMO_TAX_YEAR } from "../server/demoSession";
import { REQUEST_CONTEXT_KEYS } from "../server/ownerMiddleware";

export interface UserContext {
  userId: string;
  filingId: string;
  taxYear: number;
  scope: Scope;
  authEmail: string | null;
}

/* Throws when a value cannot resolve: a misconfiguration must surface, not hide behind defaults. */
export async function requireUserContext(
  toolContext: { requestContext?: { get: (key: string) => unknown } } | undefined,
): Promise<UserContext> {
  const rc = toolContext?.requestContext;
  if (!rc)
    throw new Error("requestContext missing — was this tool called outside an authed request?");
  const userId = rc.get(MASTRA_RESOURCE_ID_KEY) as string | undefined;
  const authEmail = (rc.get(REQUEST_CONTEXT_KEYS.userEmail) as string | undefined) ?? null;
  if (!userId)
    throw new Error("owner missing — complete first-run setup in the web app before chatting");
  const taxYear = DEMO_TAX_YEAR;
  const filing = await resolveOwnerFilingForYear(userId, taxYear);
  return {
    userId,
    filingId: filing.id,
    taxYear,
    scope: { userId, filingId: filing.id },
    authEmail,
  };
}
