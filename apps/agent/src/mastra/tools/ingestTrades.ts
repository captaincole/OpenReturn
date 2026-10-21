import {
  makeForm8949BoxDecisionKey,
  makeTradeFactKey,
  type Form8949Box,
  type TradeFactValue,
} from "@summa/engine/facts";
import { z } from "zod";
import { recordDecision } from "../db/aiDecisions";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";

/*
 * Per-sale ingest for 1099-B and 1099-DA sales (ingest-1099-b). Each sale becomes one trade fact plus one
 * broker-reported form_8949_box decision.
 */

export const TradeInputSchema = z.object({
  description: z.string().describe("Security or digital asset description, e.g. 'APPLE INC'"),
  cusip: z.string().optional(),
  symbol: z.string().optional().describe("Ticker or token symbol"),
  quantity: z.number(),
  dateAcquired: z
    .string()
    .optional()
    .describe("MM/DD/YY as printed, or 'VARIOUS' when the form prints VARIOUS. Omit when blank."),
  dateSold: z.string().describe("MM/DD/YY as printed"),
  proceeds: z.number(),
  costBasis: z
    .number()
    .optional()
    .describe(
      "The Basis column as printed, including supplemental basis on a noncovered sale. Omit only when the column is blank. Never pass 0 for a blank.",
    ),
  adjustmentCode: z.string().optional().describe("Form 8949 column (f) code, if present"),
  adjustmentAmount: z.number().optional(),
  washSaleLossDisallowed: z.number().optional(),
  federalIncomeTaxWithheld: z.number().optional(),
  term: z
    .enum(["short_term", "long_term", "unknown"])
    .describe(
      "Holding period. Read this from the section header or term checkbox on the PDF: 'Long Term' / 'Short Term' / 'Unknown Term'. Don't compute it from dates — trust what the broker reported.",
    ),
  basisReported: z
    .boolean()
    .describe(
      "True for 'Covered Securities' (basis reported to IRS), false for 'Noncovered Securities'. Read from the section header.",
    ),
});
export type TradeInput = z.infer<typeof TradeInputSchema>;

const tradeIdFor = (t: TradeInput): string => {
  const ticker = t.symbol ?? t.cusip ?? slugify(t.description);
  // MM/DD/YY → YYYY-MM-DD slug for stable, sortable IDs
  const slugDate = (d: string) => {
    const m = d.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (!m) return slugify(d);
    const [, mm, dd, yy] = m;
    return `20${yy}-${mm}-${dd}`;
  };
  return `${slugify(ticker)}-${slugDate(t.dateSold)}-q${t.quantity}`;
};

/*
 * Map the broker-reported (term, basisReported) pair to a Form 8949 box.
 * 1099-DA sales use the digital-asset boxes G/H (short) and J/K (long).
 * Unknown term falls back to the short-term boxes (conservative rate).
 */
const boxFor = (
  term: TradeInput["term"],
  basisReported: boolean,
  digitalAsset: boolean,
): Form8949Box => {
  const longTerm = term === "long_term";
  if (digitalAsset) {
    if (longTerm) return basisReported ? "partII.boxJ" : "partII.boxK";
    return basisReported ? "partI.boxG" : "partI.boxH";
  }
  if (longTerm) return basisReported ? "partII.boxD" : "partII.boxE";
  return basisReported ? "partI.boxA" : "partI.boxB";
};

const termLabel = (term: TradeInput["term"]): string =>
  term === "long_term" ? "long-term" : term === "short_term" ? "short-term" : "unknown-term";

/*
 * Write one trade's fact row plus its form_8949_box decision. The
 * decision is auto-recorded — the broker already classified the sale.
 * The write goes directly through recordDecision and skips the grounding
 * review; the input is broker-reported, not a judgment call.
 */
async function ingestOneTrade(
  ctx: IngestCtx,
  slug: string,
  t: TradeInput,
  digitalAsset: boolean,
): Promise<string> {
  const tradeId = tradeIdFor(t);
  const trade: TradeFactValue = {
    tradeId,
    description: t.description,
    cusip: t.cusip,
    symbol: t.symbol,
    quantity: t.quantity,
    dateAcquired: t.dateAcquired,
    dateSold: t.dateSold,
    proceeds: t.proceeds,
    costBasis: t.costBasis,
    adjustmentCode: t.adjustmentCode,
    adjustmentAmount: t.adjustmentAmount,
  };
  const factKey = makeTradeFactKey(slug, tradeId);
  await recordIngestFact(ctx, "investment_income", factKey, trade);

  const box = boxFor(t.term, t.basisReported, digitalAsset);
  const form = digitalAsset ? "1099-DA" : "1099-B";
  await recordDecision(ctx.scope, {
    id: crypto.randomUUID(),
    userId: ctx.userId,
    filingId: ctx.filingId,
    taxYear: ctx.year,
    decisionKey: makeForm8949BoxDecisionKey(tradeId),
    decision: box,
    rationale:
      `${form} reports a ${termLabel(t.term)} ` +
      `${t.basisReported ? "covered" : "noncovered"} sale → Form 8949 ${box}.`,
    supportingFactKeys: [factKey],
    confidence: "high",
    sourceNote: `Auto-classified during ${form} ingest (broker-reported section)`,
  });
  return tradeId;
}

/** Record one scope decision with high confidence (broker-reported). */
async function recordScopeDecision(
  ctx: IngestCtx,
  decisionKey: string,
  rationale: string,
  supportingFactKeys: string[],
): Promise<void> {
  await recordDecision(ctx.scope, {
    id: crypto.randomUUID(),
    userId: ctx.userId,
    filingId: ctx.filingId,
    taxYear: ctx.year,
    decisionKey,
    decision: true,
    rationale,
    supportingFactKeys,
    confidence: "high",
    sourceNote: "Auto-recorded during 1099 ingest",
  });
}

/*
 * Ingest every sale (one fact + one box decision each), then record the
 * has_reportable_sales scope decision that gates Form 8949 / Schedule D.
 * 1099-DA sales also record has_digital_assets (the 1040 digital asset
 * question is Yes).
 */
export async function ingestTrades(
  ctx: IngestCtx,
  slug: string,
  trades: TradeInput[],
  payerName: string,
  opts: { digitalAsset: boolean },
): Promise<{ tradeIds: string[]; decisionsWritten: number }> {
  const tradeIds: string[] = [];
  for (const t of trades) {
    tradeIds.push(await ingestOneTrade(ctx, slug, t, opts.digitalAsset));
  }
  const factKeys = tradeIds.map((id) => makeTradeFactKey(slug, id));
  const form = opts.digitalAsset ? "1099-DA" : "1099-B";

  await recordScopeDecision(
    ctx,
    "decisions.scope.has_reportable_sales",
    `${form} from ${payerName} reports ${trades.length} sale(s).`,
    factKeys,
  );
  let decisionsWritten = tradeIds.length + 1;
  if (opts.digitalAsset) {
    await recordScopeDecision(
      ctx,
      "decisions.scope.has_digital_assets",
      `1099-DA from ${payerName} reports ${trades.length} digital asset sale(s), so the 1040 digital asset question is Yes.`,
      factKeys,
    );
    decisionsWritten++;
  }
  return { tradeIds, decisionsWritten };
}
