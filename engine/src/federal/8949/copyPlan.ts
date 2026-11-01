/*
 * IRS: one box per Form 8949 page, 11 rows per part. The engine keeps one
 * form; the renderer evaluates it once per copy and merges the pages.
 * Rows keep broker-statement (ingest) order.
 */

import type { Form8949Box, TradeFactValue } from "../../facts/index.js";
import { sum } from "../../money.js";

export const ROWS_PER_PAGE = 11;

const PART_I_BOXES: Form8949Box[] = [
  "partI.boxA",
  "partI.boxB",
  "partI.boxC",
  "partI.boxG",
  "partI.boxH",
  "partI.boxI",
];
const PART_II_BOXES: Form8949Box[] = [
  "partII.boxD",
  "partII.boxE",
  "partII.boxF",
  "partII.boxJ",
  "partII.boxK",
  "partII.boxL",
];

export interface BoxedTrade {
  trade: TradeFactValue;
  box: Form8949Box;
  basis?: number;
}

export interface Form8949Page {
  box: Form8949Box;
  rows: BoxedTrade[];
}

export interface Form8949Copy {
  partI?: Form8949Page;
  partII?: Form8949Page;
}

/** Across every copy; not rounded. */
export interface BoxTotals {
  proceeds: number;
  cost: number;
}

export function planForm8949Copies(trades: readonly BoxedTrade[]): Form8949Copy[] {
  const partI = pagesFor(trades, PART_I_BOXES);
  const partII = pagesFor(trades, PART_II_BOXES);
  const count = Math.max(partI.length, partII.length);
  return Array.from({ length: count }, (_, i) => ({ partI: partI[i], partII: partII[i] }));
}

export function totalsByBox(
  trades: readonly BoxedTrade[],
): Partial<Record<Form8949Box, BoxTotals>> {
  const out: Partial<Record<Form8949Box, BoxTotals>> = {};
  for (const trade of trades) {
    const totals = (out[trade.box] ??= { proceeds: 0, cost: 0 });
    totals.proceeds = sum(totals.proceeds, trade.trade.proceeds);
    totals.cost = sum(totals.cost, trade.basis);
  }
  return out;
}

function pagesFor(trades: readonly BoxedTrade[], boxes: Form8949Box[]): Form8949Page[] {
  const pages: Form8949Page[] = [];
  for (const box of boxes) {
    const rows = trades.filter((trade) => trade.box === box);
    for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
      pages.push({ box, rows: rows.slice(i, i + ROWS_PER_PAGE) });
    }
  }
  return pages;
}
