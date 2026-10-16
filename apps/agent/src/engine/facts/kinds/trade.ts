/*
 * Trade fact kind. Each 1099-B row (a single sale) is stored as one
 * tax_facts row under category "investment_income" with a structured
 * value.
 *
 * Convention (lives ONLY here; never spell out the regex elsewhere):
 *   category: "investment_income"
 *   key:      "account.{accountSlug}.trades.{tradeId}"
 *   value:    TradeFactValue
 *
 * Reads call `getTradeFacts(facts)`. Writes call
 * `makeTradeFactKey(slug, id)` to build the key, paired with the typed
 * value. Both sides reference the same convention, so they cannot drift.
 *
 * 1099-DA sales use the same kind. The Form 8949 box (A–L) is not a
 * field here: it is the per-trade AI decision
 * `decisions.trade.{tradeId}.form_8949_box`.
 *
 * Taxpayer-reported basis. A noncovered sale can leave 1099-B box 1e
 * blank. The taxpayer then gives the basis, stored as a separate fact so
 * its citation is the taxpayer, not the broker:
 *   category: "capital_gains"
 *   key:      "account.{accountSlug}.trades.{tradeId}.reported_basis"
 *   value:    number
 * getTradeFacts() attaches it as `reportedBasis`. Use basisOf() to read
 * the basis that applies.
 */

import type { FactsView } from "../../types.js";
import type { TaxFactRow } from "../rows.js";

export interface TradeFactValue {
  tradeId: string;
  description: string; // "APPLE INC"
  cusip?: string;
  symbol?: string;
  quantity: number;
  /*
   * "MM/DD/YY" as printed on the 1099-B or 1099-DA, or "VARIOUS" when
   * the sale combines lots bought on different dates. Absent when the
   * form leaves it blank (noncovered sales often do).
   */
  dateAcquired?: string;
  dateSold: string;
  proceeds: number;
  /*
   * Box 1e. Absent when the form leaves it blank (noncovered). See the
   * taxpayer-reported basis fact above.
   */
  costBasis?: number;
  adjustmentCode?: string; // Form 8949 column (f), optional
  adjustmentAmount?: number; // column (g), optional
}

/**
 * Parsed view of a trade fact: the structured value, the components
 * extracted from the key, and the underlying TaxFactRow for source-note
 * tracking.
 */
export interface TradeFact {
  accountSlug: string;
  tradeId: string;
  trade: TradeFactValue;
  sourceFact: TaxFactRow;
  reportedBasis?: { costBasis: number; sourceFact: TaxFactRow };
}

/** The basis that applies: the form's box 1e, else the taxpayer's. */
export function basisOf(t: TradeFact): number | undefined {
  return t.trade.costBasis ?? t.reportedBasis?.costBasis;
}

/** True when an acquired date is "VARIOUS" (any case). */
export function isVariousDate(date: string): boolean {
  return date.trim().toUpperCase() === "VARIOUS";
}

const TRADE_CATEGORY = "investment_income";
const TRADE_KEY_RE = /^account\.([^.]+)\.trades\.([^.]+)$/;

/*
 * Form 8949 box for one trade, stored as the AI decision
 * `decisions.trade.{tradeId}.form_8949_box`. Part I is short-term,
 * Part II is long-term. Boxes G–L are the 1099-DA (digital asset) boxes
 * on the 2025 form.
 */
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

/** Holding period from the box: Part II is long-term. */
export function isLongTermBox(box: string): boolean {
  return box.startsWith("partII.");
}

const REPORTED_BASIS_CATEGORY = "capital_gains";

/** Key for the taxpayer-reported basis of one trade. */
export function makeReportedBasisFactKey(accountSlug: string, tradeId: string): string {
  return `${makeTradeFactKey(accountSlug, tradeId)}.reported_basis`;
}

export function isReportedBasisFact(f: TaxFactRow): boolean {
  return f.category === REPORTED_BASIS_CATEGORY && f.key.endsWith(".reported_basis");
}

/**
 * Build the canonical fact key for a trade. Use this in ingest tools
 * rather than concatenate the string by hand.
 */
export function makeTradeFactKey(accountSlug: string, tradeId: string): string {
  return `account.${accountSlug}.trades.${tradeId}`;
}

/** True only when this row is a trade fact under our convention. */
export function isTradeFact(f: TaxFactRow): boolean {
  return f.category === TRADE_CATEGORY && TRADE_KEY_RE.test(f.key);
}

/**
 * Parse one TaxFactRow as a trade fact. Returns null when the row's
 * category or key shape does not match. Trusts the value shape: no
 * runtime validation yet, because ingest goes through typed helpers.
 */
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

/** All trade facts for the current taxpayer, parsed and typed. */
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
