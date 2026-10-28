/*
 * One fact per 1099-B or 1099-DA sale. The key convention lives only here.
 * The Form 8949 box is the AI decision `decisions.trade.{tradeId}.form_8949_box`, not a field.
 * A taxpayer-given basis (box 1e blank) is a separate "capital_gains" fact so its citation is the taxpayer.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface TradeFactValue {
  tradeId: string;
  description: string;
  cusip?: string;
  symbol?: string;
  quantity: number;
  /* "MM/DD/YY" as printed, or "VARIOUS". Noncovered sales can leave it blank. */
  dateAcquired?: string;
  dateSold: string;
  proceeds: number;
  /* Box 1e. Read it with basisOf(), which falls back to the taxpayer-reported basis. */
  costBasis?: number;
  adjustmentCode?: string; // Form 8949 column (f)
  adjustmentAmount?: number; // column (g)
}

export interface TradeFact {
  accountSlug: string;
  tradeId: string;
  trade: TradeFactValue;
  sourceFact: TaxFactRow;
  reportedBasis?: { costBasis: number; sourceFact: TaxFactRow };
}

export function basisOf(t: TradeFact): number | undefined {
  return t.trade.costBasis ?? t.reportedBasis?.costBasis;
}

export function isVariousDate(date: string): boolean {
  return date.trim().toUpperCase() === "VARIOUS";
}

const TRADE_CATEGORY = "investment_income";
const TRADE_KEY_RE = /^account\.([^.]+)\.trades\.([^.]+)$/;

/* Part I is short-term, Part II long-term. Boxes G–L are the 2025 1099-DA boxes. */
export type Form8949Box =
  | "partI.boxA"
  | "partI.boxB"
  | "partI.boxC"
  | "partI.boxG"
  | "partI.boxH"
  | "partI.boxI"
  | "partII.boxD"
  | "partII.boxE"
  | "partII.boxF"
  | "partII.boxJ"
  | "partII.boxK"
  | "partII.boxL";

export function makeForm8949BoxDecisionKey(tradeId: string): string {
  return `decisions.trade.${tradeId}.form_8949_box`;
}

export function isLongTermBox(box: string): boolean {
  return box.startsWith("partII.");
}

const REPORTED_BASIS_CATEGORY = "capital_gains";

export function makeReportedBasisFactKey(accountSlug: string, tradeId: string): string {
  return `${makeTradeFactKey(accountSlug, tradeId)}.reported_basis`;
}

export function isReportedBasisFact(f: TaxFactRow): boolean {
  return f.category === REPORTED_BASIS_CATEGORY && f.key.endsWith(".reported_basis");
}

export function makeTradeFactKey(accountSlug: string, tradeId: string): string {
  return `account.${accountSlug}.trades.${tradeId}`;
}

export function isTradeFact(f: TaxFactRow): boolean {
  return f.category === TRADE_CATEGORY && TRADE_KEY_RE.test(f.key);
}

/* Trusts the value shape: ingest writes it through typed helpers. */
export function parseTradeFact(f: TaxFactRow): TradeFact | null {
  if (f.category !== TRADE_CATEGORY) return null;
  const match = f.key.match(TRADE_KEY_RE);
  if (!match) return null;
  const [, accountSlug, tradeId] = match;
  return {
    accountSlug,
    tradeId,
    trade: f.value as TradeFactValue,
    sourceFact: f,
  };
}

export function getTradeFacts(facts: FactsView): TradeFact[] {
  const out: TradeFact[] = [];
  for (const f of facts.byCategory(TRADE_CATEGORY)) {
    const parsed = parseTradeFact(f);
    if (parsed === null) continue;
    const basisRow = facts.get(makeReportedBasisFactKey(parsed.accountSlug, parsed.tradeId));
    if (basisRow !== undefined && typeof basisRow.value === "number") {
      parsed.reportedBasis = { costBasis: basisRow.value, sourceFact: basisRow };
    }
    out.push(parsed);
  }
  return out;
}
