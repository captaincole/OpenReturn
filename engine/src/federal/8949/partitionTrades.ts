/*
 * Trade-fact partitioning for Form 8949 / Schedule D.
 * makeResolverInputs (resolverInputs.ts) builds ResolverInputs.trades
 * with partitionTrades().
 */

import {
  isLongTermBox,
  makeForm8949BoxDecisionKey,
  type Form8949Box,
  type TradeFactValue,
} from "../../facts/index.js";
import type { BoxedTrade } from "./copyPlan.js";

/*
 * Mirrors the key convention in src/facts/kinds/trade.ts. Inlined
 * here because parseTradeFact() expects a full TaxFactRow, while the
 * resolver only sees a {key, value, category} projection. The thinner
 * shape is enough to recognize and decode a trade fact.
 */
const TRADE_KEY_RE = /^account\.([^.]+)\.trades\.([^.]+)$/;

export interface PartitionedTrades {
  short: TradeFactValue[];
  long: TradeFactValue[];
  /** Every sale with its Form 8949 box and applicable basis, in fact order. */
  boxed: BoxedTrade[];
  factKeys: string[];
}

/*
 * Trade-fact partitioning for Form 8949. Walk investment_income facts,
 * pull out anything that parses as a trade (key shape
 * `account.<slug>.trades.<tradeId>`), then split by holding period.
 * The per-trade box decision wins: the broker reports the term, and a
 * "VARIOUS" acquired date cannot be dated. Without a decision, fall back
 * to the dates: held > 1 year ⇒ long-term, else short-term. Facts store
 * dates as "MM/DD/YY" or "MM/DD/YYYY"; both parse. The fact-key list
 * feeds the engine-derivation audit trail (triggeredByFactKeys).
 *
 * `boxed` carries the box (the decision, else A or D by term) and the
 * basis: the broker's box 1e, else the taxpayer-reported basis fact
 * (`<trade key>.reported_basis`, category capital_gains).
 */
export function partitionTrades(
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>,
  decisionByKey: Map<string, unknown>,
): PartitionedTrades {
  const short: TradeFactValue[] = [];
  const long: TradeFactValue[] = [];
  const boxed: BoxedTrade[] = [];
  const factKeys: string[] = [];
  const reportedBasis = new Map<string, number>();
  for (const row of facts) {
    if (row.category === "capital_gains" && typeof row.value === "number") {
      reportedBasis.set(row.key, row.value);
    }
  }
  for (const row of facts) {
    if (row.category !== "investment_income") continue;
    if (!TRADE_KEY_RE.test(row.key)) continue;
    const trade = row.value as TradeFactValue;
    const decided = decisionByKey.get(makeForm8949BoxDecisionKey(trade.tradeId));
    const longTerm = typeof decided === "string" ? isLongTermBox(decided) : isLongTermTrade(trade);
    (longTerm ? long : short).push(trade);
    const box: Form8949Box =
      typeof decided === "string"
        ? (decided as Form8949Box)
        : longTerm
          ? "partII.boxD"
          : "partI.boxA";
    const basis = trade.costBasis ?? reportedBasis.get(`${row.key}.reported_basis`);
    boxed.push({ trade, box, basis });
    factKeys.push(row.key);
  }
  return { short, long, boxed, factKeys };
}

/*
 * Trade-date parser. Accepts "MM/DD/YY" or "MM/DD/YYYY", the formats
 * brokers print on a 1099-B. Two-digit years anchor to the 2000s.
 */
function parseTradeDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  return new Date(year, month - 1, day);
}

/*
 * IRC §1222 short/long-term split: held more than 1 year is long-term.
 * "More than 1 year" means strictly past the anniversary date, at day
 * precision. Missing or unparseable dates default to short-term. That is the
 * conservative choice (higher rate) versus a long-term mislabel.
 */
function isLongTermTrade(t: TradeFactValue): boolean {
  const acq = t.dateAcquired === undefined ? null : parseTradeDate(t.dateAcquired);
  const sold = parseTradeDate(t.dateSold);
  if (!acq || !sold) return false;
  const anniversary = new Date(acq);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  return sold > anniversary;
}
