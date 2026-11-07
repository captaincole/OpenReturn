import {
  isLongTermBox,
  makeForm8949BoxDecisionKey,
  printsShareCount,
  type Form8949Box,
  type TradeFactValue,
} from "../../facts/index.js";
import type { BoxedTrade } from "./copyPlan.js";

/*
 * Mirrors facts/kinds/trade.ts. parseTradeFact() needs a full TaxFactRow,
 * and the resolver only sees {key, value, category}.
 */
const TRADE_KEY_RE = /^account\.([^.]+)\.trades\.([^.]+)$/;

export interface PartitionedTrades {
  short: TradeFactValue[];
  long: TradeFactValue[];
  boxed: BoxedTrade[];
  factKeys: string[];
  /* The stated-quantity key of each trade whose share count is unknown. */
  missingQuantityKeys: string[];
}

/*
 * The per-trade box decision wins over the dates: the broker reports the
 * term, and a "VARIOUS" acquired date cannot be dated.
 */
export function partitionTrades(
  facts: ReadonlyArray<{ key: string; value: unknown; category: string }>,
  decisionByKey: Map<string, unknown>,
): PartitionedTrades {
  const short: TradeFactValue[] = [];
  const long: TradeFactValue[] = [];
  const boxed: BoxedTrade[] = [];
  const factKeys: string[] = [];
  const missingQuantityKeys: string[] = [];
  /* Reported basis and stated share counts: numeric facts keyed next to their trade. */
  const stated = new Map<string, number>();
  for (const row of facts) {
    if (row.category === "capital_gains" && typeof row.value === "number") {
      stated.set(row.key, row.value);
    }
  }
  for (const row of facts) {
    if (row.category !== "investment_income") continue;
    if (!TRADE_KEY_RE.test(row.key)) continue;
    const printed = row.value as TradeFactValue;
    const quantity = printed.quantity ?? stated.get(`${row.key}.quantity`);
    if (quantity === undefined && !printsShareCount(printed.description)) {
      missingQuantityKeys.push(`${row.key}.quantity`);
    }
    const trade: TradeFactValue = { ...printed, quantity };
    const decided = decisionByKey.get(makeForm8949BoxDecisionKey(trade.tradeId));
    const longTerm = typeof decided === "string" ? isLongTermBox(decided) : isLongTermTrade(trade);
    (longTerm ? long : short).push(trade);
    const box: Form8949Box =
      typeof decided === "string"
        ? (decided as Form8949Box)
        : longTerm
          ? "partII.boxD"
          : "partI.boxA";
    const basis = trade.costBasis ?? stated.get(`${row.key}.reported_basis`);
    boxed.push({ trade, box, basis });
    factKeys.push(row.key);
  }
  return { short, long, boxed, factKeys, missingQuantityKeys };
}

function parseTradeDate(text: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(text);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  if (year < 100) year += 2000;
  return new Date(year, month - 1, day);
}

/*
 * IRC §1222: long-term means sold strictly after the anniversary date.
 * Missing dates default to short-term, the conservative (higher-rate) choice.
 */
function isLongTermTrade(trade: TradeFactValue): boolean {
  const acq = trade.dateAcquired === undefined ? null : parseTradeDate(trade.dateAcquired);
  const sold = parseTradeDate(trade.dateSold);
  if (!acq || !sold) return false;
  const anniversary = new Date(acq);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  return sold > anniversary;
}
