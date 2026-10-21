import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { statementContext, statementFields } from "./ingestShared";
import { ingestTrades, TradeInputSchema } from "./ingestTrades";

/*
 * Ingest the sales on a 1099-B or 1099-DA: a standalone form, or the
 * 1099-B section of a consolidated statement (the box-total forms on the
 * same statement go to ingest1099Forms.ts).
 *
 * At most 20 sales per call; Luca calls again for the next 20. Trade ids
 * come from each sale's content (ingestTrades.ts), so the calls add up
 * without collisions. Long calls failed: after about 20 trades, local
 * models (Gemma 4 31b) broke the call's nesting about half the time.
 *
 * Writes per call: 1 trade fact + 1 form_8949_box decision per sale, plus
 * decisions.scope.has_reportable_sales (and has_digital_assets for a
 * 1099-DA).
 */

export const MAX_TRADES_PER_CALL = 20;

export const ingest1099B = createTool({
  id: "ingest-1099-b",
  description: `Ingest the sales on a 1099-B (standalone, or the 1099-B section of a consolidated statement) or a 1099-DA. Pass at most ${MAX_TRADES_PER_CALL} sales per call. For more, call again with the next ${MAX_TRADES_PER_CALL} and the same payer and accountSlug; each call adds to the earlier ones.`,
  inputSchema: z.object({
    ...statementFields,
    form: z
      .enum(["1099-B", "1099-DA"])
      .describe(
        "1099-DA for digital asset sales; the tool then answers the 1040 digital asset question (Yes).",
      ),
    trades: z
      .array(TradeInputSchema)
      .describe(`One entry per sale, at most ${MAX_TRADES_PER_CALL} per call.`),
  }),
  outputSchema: z.object({
    accountSlug: z.string(),
    factsWritten: z.number(),
    decisionsWritten: z.number(),
    tradeIds: z.array(z.string()),
  }),
  execute: async (input, context) => {
    const { ctx, slug } = await statementContext(input, context, input.form);
    const { tradeIds, decisionsWritten } = await ingestTrades(
      ctx,
      slug,
      input.trades,
      input.payer.name,
      { digitalAsset: input.form === "1099-DA" },
    );
    return { accountSlug: slug, factsWritten: tradeIds.length, decisionsWritten, tradeIds };
  },
});
