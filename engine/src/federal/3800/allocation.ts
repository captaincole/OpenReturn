/*
 * Which credits a tier's allowed amount uses, row by row. "General business
 * credits reported on Form 3800 are treated as used on a first-in, first-out
 * basis by offsetting the earliest-earned credits first": carryforwards, the
 * earliest first; then the credits of this year; then the carryback
 * (irs-3800-inst-2025::sec::credit-ordering-rule::b01). Within one year the
 * credits are used in the order of ::b02 to ::b04 (rows.ts rankOf). Part III
 * column (i), Part IV column (g) and Parts V and VI read the result.
 *
 * DECISION (2026-11-25, by the author): Part IV column (g) is the part of each
 * carryover the tax limit uses, in the order of use.
 * - Part IV column (g): "Amount of columns (e) and (f) applied against tax in
 *   Part II" (irs-3800-face-2025::sec::face-part-iv::b01), and column (i)
 *   subtracts it to give the carryforward to 2026 (irs-3800-inst-2025::sec::part-iv-2::b04).
 * - The same block: "Line 7 of this column should equal to the sum of Part II,
 *   lines 33, 34, and 35", which are only the specified carryovers and the
 *   passive specified credits, entered before the limit.
 * The engine follows the column's caption and the order of use: the sentence
 * would leave out the carryovers of lines 1a to 3 and count a carryover the
 * limit does not allow.
 */

import { atLeast } from "../../money.js";
import { isGap, type Cell } from "./cells.js";
import { TAX_YEAR, type Carryover, type CurrentCredit } from "./credits.js";
import { partIIIRow, partIVRow, rankOf, type Tier } from "./rows.js";

export type Source = CurrentCredit | Carryover;

export interface Claim {
  source: Source;
  /* What the source brings to the tier: its column (g), or its column (f) carryover. */
  amount: number;
  year: number;
  rank: number;
}

const isCarryover = (source: Source): source is Carryover => "originYear" in source;

/* The order of use: earlier years first (this year's credits sit at 2025), then the rank. */
function compareClaims(left: Claim, right: Claim): number {
  return left.year - right.year || left.rank - right.rank;
}

export const tierOfSource = (source: Source): Tier | undefined =>
  (isCarryover(source) ? partIVRow(source.line) : partIIIRow(source.line))?.tier;

export function claimOf(source: Source, amount: number): Claim {
  const year = isCarryover(source) ? source.originYear : TAX_YEAR;
  return { source, amount, year, rank: rankOf(source.line) };
}

/*
 * The amount each claim uses of the limit, in the order of use; a gap in the
 * limit is a gap for every claim. The sort is stable, so sources of the same
 * line keep their order.
 */
export function allocate(claims: ReadonlyArray<Claim>, limit: Cell): Map<Source, Cell> {
  const used = new Map<Source, Cell>();
  if (isGap(limit)) {
    for (const claim of claims) used.set(claim.source, limit);
    return used;
  }
  let left = typeof limit === "number" ? limit : 0;
  for (const claim of [...claims].sort(compareClaims)) {
    const amount = Math.min(atLeast(0, claim.amount), left);
    used.set(claim.source, amount);
    left -= amount;
  }
  return used;
}
