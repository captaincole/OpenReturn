import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import { cade } from "../../agents/cade";
import { deleteFilingBlobs } from "../../db/blobStore";
import { deleteFilingCascade, getMembership } from "../../db/filings";

/* The SQL cascade does not reach the blob files or the Mastra thread: this route deletes both. */

function threadIdFor(userId: string, year: number | string): string {
  return `${userId}::${year}`;
}

export const deleteFilingRoute = registerApiRoute("/app/filings/:filingId", {
  method: "DELETE",
  handler: async (ctx) => {
    const requestContext = ctx.get("requestContext");
    const callerId = requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string | undefined;
    if (!callerId) return ctx.json({ error: "unauthorized" }, 401);

    const filingId = ctx.req.param("filingId");
    if (!filingId) return ctx.json({ error: "missing filingId" }, 400);

    /* There is no RLS: this gate is all that keeps the caller from another filing. */
    const ownership = await getMembership(filingId, callerId, "owner");
    if (!ownership) return ctx.json({ error: "forbidden" }, 403);
    const taxYear = ownership.taxYear;

    await deleteFilingBlobs(filingId);

    await deleteFilingCascade(filingId);

    /* The thread id must match web/lib/returns.ts:threadIdFor. */
    try {
      const memory = await cade.getMemory();
      if (memory) {
        await memory.deleteThread(threadIdFor(callerId, taxYear));
      }
    } catch {
      // Best-effort.
    }

    return ctx.json({ ok: true, filingId, taxYear });
  },
});
