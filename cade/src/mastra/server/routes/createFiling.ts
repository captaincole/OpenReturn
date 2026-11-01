import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import { registerApiRoute } from "@mastra/core/server";
import { cade } from "../../agents/cade";
import { ensureAppSchema, getAppDb } from "../../db/appDb";
import { createOwnerFiling } from "../../db/filings";

/* Idempotent: a caller with an owner membership for the year gets that filing back. */

const DEFAULT_TAX_YEAR = 2025;
const MIN_TAX_YEAR = 2020;
const MAX_TAX_YEAR = 2030;

// Must match web/lib/returns.ts:threadIdFor — no shared package yet.
function threadIdFor(userId: string, year: number | string): string {
  return `${userId}::${year}`;
}

/*
 * Without a thread, the chat-history fetch gets Mastra's "Thread not found" 500.
 * Best-effort: the first message creates the thread if this fails.
 */
async function ensureThread(userId: string, taxYear: number): Promise<void> {
  try {
    const memory = await cade.getMemory();
    if (!memory) return;
    await memory.createThread({
      threadId: threadIdFor(userId, taxYear),
      resourceId: userId,
      title: `${taxYear} return`,
    });
  } catch {
    // Best-effort.
  }
}

export const createFilingRoute = registerApiRoute("/app/filings", {
  method: "POST",
  handler: async (ctx) => {
    const requestContext = ctx.get("requestContext");
    const callerId = requestContext?.get(MASTRA_RESOURCE_ID_KEY) as string | undefined;
    if (!callerId) return ctx.json({ error: "unauthorized" }, 401);

    let body: unknown = undefined;
    try {
      body = await ctx.req.json();
    } catch {
      body = {};
    }
    const taxYearRaw = (body as { taxYear?: unknown })?.taxYear;
    const taxYear =
      typeof taxYearRaw === "number" && Number.isInteger(taxYearRaw)
        ? taxYearRaw
        : DEFAULT_TAX_YEAR;
    if (taxYear < MIN_TAX_YEAR || taxYear > MAX_TAX_YEAR) {
      return ctx.json({ error: `taxYear out of range (${taxYear})` }, 400);
    }

    // Explicit membership predicate: there is no RLS.
    await ensureAppSchema();
    const existing = await getAppDb().execute({
      sql: `SELECT f.id, f.tax_year, f.status
            FROM filings f
            JOIN filing_members m ON m.filing_id = f.id
            WHERE m.user_id = ? AND m.role = 'owner' AND m.revoked_at IS NULL
              AND f.tax_year = ?
            LIMIT 1`,
      args: [callerId, taxYear],
    });
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      /* An earlier thread bootstrap may have failed. */
      await ensureThread(callerId, Number(row.tax_year));
      return ctx.json({
        filing: {
          id: String(row.id),
          taxYear: Number(row.tax_year),
          status: String(row.status),
        },
        created: false,
      });
    }

    const filingId = crypto.randomUUID();
    await createOwnerFiling({ filingId, userId: callerId, taxYear });

    await ensureThread(callerId, taxYear);

    return ctx.json({
      filing: { id: filingId, taxYear, status: "draft" },
      created: true,
    });
  },
});
