import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import { cade } from "../../agents/cade";
import { deleteFilingBlobs } from "../../db/blobStore";
import { deleteFilingCascade, getMembership } from "../../db/filings";
import { deductionsThreadId, mainThreadId } from "../../threads";

/* The SQL cascade does not reach the blob files or the Mastra threads: this route deletes both. */

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

    /* Each thread on its own: a filing made before the deductions thread has only the first. */
    const memory = await cade.getMemory().catch(() => undefined);
    for (const threadId of [
      mainThreadId(callerId, taxYear),
      deductionsThreadId(callerId, taxYear),
    ]) {
      // Best-effort.
      await memory?.deleteThread(threadId).catch(() => undefined);
    }

    return ctx.json({ ok: true, filingId, taxYear });
  },
});
