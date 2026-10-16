/*
 * Form 8949 copy plan. The IRS allows one box per Form 8949 page and 11
 * rows per part, so a return with sales in several boxes files several
 * copies. The engine keeps Form 8949 as ONE form (copy 1, the
 * default `form8949CopyIndex`); the renderer evaluates it once per copy
 * and merges the pages. Schedule D reads the per-box totals.
 *
 * Plan: group the sales by box (letter order), cut each group into pages
 * of 11 rows, then pair Part I page n with Part II page n as copy n.
 * Rows keep the order the broker statement lists them (ingest order).
 */

import type { Form8949Box, TradeFactValue } from "../../facts/index.js";

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

/** A sale with its Form 8949 box and the basis that applies (broker or taxpayer-reported). */
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

/** Column totals for one box across every copy, in cents (not rounded). */
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
  for (const t of trades) {
    const totals = (out[t.box] ??= { proceeds: 0, cost: 0 });
    totals.proceeds += t.trade.proceeds;
    totals.cost += t.basis ?? 0;
  }
  return out;
}

function pagesFor(trades: readonly BoxedTrade[], boxes: Form8949Box[]): Form8949Page[] {
  const pages: Form8949Page[] = [];
  for (const box of boxes) {
    const rows = trades.filter((t) => t.box === box);
    for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
      pages.push({ box, rows: rows.slice(i, i + ROWS_PER_PAGE) });
    }
  }
  return pages;
}
