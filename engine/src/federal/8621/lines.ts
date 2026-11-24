/*
 * Form 8621 Parts I, III and IV: pure arithmetic on one fund's amounts.
 * "If two or more amounts must be added to figure the amount to enter on a
 * line, include cents when adding the amounts and round off only the total"
 * (irs-8621-inst-2025::sec::rounding-off-to-whole-dollars::b01). The engine
 * rounds every line to whole dollars; a line that is arithmetic on other
 * lines uses their rounded values.
 */

import type { PficDisposition, PficQefAmounts } from "../../facts/index.js";
import { roundDollars } from "../../money.js";

/* Line 4 boxes (a)–(d) and their upper ends; above the last, line 4(e) lists the value. */
export const VALUE_RANGE_TOPS = [50_000, 100_000, 150_000, 200_000] as const;
export type ValueBox = "a" | "b" | "c" | "d" | "e";
const VALUE_BOXES: readonly ValueBox[] = ["a", "b", "c", "d"];

/* Line 4 (irs-8621-inst-2025::sec::line-4::b01): the box whose range holds the value. */
export function valueBox(value: number): ValueBox {
  const whole = roundDollars(value);
  const index = VALUE_RANGE_TOPS.findIndex((top) => whole <= top);
  return index === -1 ? "e" : VALUE_BOXES[index];
}

export interface PartIIILines {
  line6a: number;
  line6b: number;
  line6c: number;
  line7a: number;
  line7b: number;
  line7c: number;
  /* Lines 8a–8e: only with Election B for the year (::part-iii::b01). */
  electionB?: { line8a: number; line8b: number; line8c: number; line8d: number; line8e: number };
}

/*
 * Lines 6a–7c (::lines-6a-and-7a::b01, ::lines-6b-and-7b::b01): the pro rata
 * shares, less the parts included under section 951 or excluded under section
 * 1293(g). Lines 8a–8e (the form; ::line-8::b01) only with Election B.
 */
export function partIIILines(qef: PficQefAmounts, electionB: boolean): PartIIILines {
  const line6a = roundDollars(qef.ordinaryEarnings);
  const line6b = roundDollars(qef.ordinaryEarningsExcluded ?? 0);
  const line7a = roundDollars(qef.netCapitalGain);
  const line7b = roundDollars(qef.netCapitalGainExcluded ?? 0);
  const lines = {
    line6a,
    line6b,
    line6c: line6a - line6b,
    line7a,
    line7b,
    line7c: line7a - line7b,
  };
  if (!electionB) return lines;
  const line8a = lines.line6c + lines.line7c;
  const line8b = roundDollars(qef.distributions ?? 0);
  const line8c = roundDollars(qef.disposedSharesIncome ?? 0);
  const line8d = line8b + line8c;
  return { ...lines, electionB: { line8a, line8b, line8c, line8d, line8e: line8a - line8d } };
}

export interface PartIVYearEnd {
  line10a: number;
  line10b: number;
  line10c: number;
  /* Lines 11 and 12 only after a loss on line 10c. Line 12 is a loss: 0 or less. */
  line11?: number;
  line12?: number;
}

/*
 * Lines 10a–12 (::lines-10a-through-12::b01): a gain is ordinary income; a
 * loss is allowed "only to the extent of ... the lesser of" the loss and the
 * unreversed inclusions, as an ordinary loss.
 */
export function partIVYearEnd(
  value: number,
  amounts: { adjustedBasis: number; unreversedInclusions?: number },
): PartIVYearEnd {
  const line10a = roundDollars(value);
  const line10b = roundDollars(amounts.adjustedBasis);
  const line10c = line10a - line10b;
  if (line10c >= 0) return { line10a, line10b, line10c };
  const line11 = roundDollars(amounts.unreversedInclusions ?? 0);
  return { line10a, line10b, line10c, line11, line12: 0 - Math.min(-line10c, line11) };
}

export interface PartIVDisposition {
  line13a: number;
  line13b: number;
  line13c: number;
  /* Lines 14a–14c only after a loss on line 13c. Lines 14b and 14c are losses. */
  line14a?: number;
  line14b?: number;
  line14c?: number;
}

/*
 * Lines 13a–14c (::line-13c::b01, ::line-14a::b01, ::line-14b::b01,
 * ::line-14c::b01): a gain is ordinary income; a loss is ordinary up to the
 * unreversed inclusions, and the rest (line 14c) follows the general loss
 * rules. Line 14c is blank when the loss is not more than the inclusions.
 */
export function partIVDisposition(sale: PficDisposition): PartIVDisposition {
  const line13a = roundDollars(sale.amountRealized);
  const line13b = roundDollars(sale.adjustedBasis);
  const line13c = line13a - line13b;
  if (line13c >= 0) return { line13a, line13b, line13c };
  const line14a = roundDollars(sale.unreversedInclusions ?? 0);
  const line14b = 0 - Math.min(-line13c, line14a);
  const excess = line13c - line14b;
  return { line13a, line13b, line13c, line14a, line14b, line14c: excess < 0 ? excess : undefined };
}

/* The section 1296 amount of the year (Part I line 5c): the ordinary gain or loss of lines 10c/12 and 13c/14b. */
export function markToMarketOrdinary(
  yearEnd: PartIVYearEnd | undefined,
  sale: PartIVDisposition | undefined,
): number {
  const held = yearEnd === undefined ? 0 : (yearEnd.line12 ?? yearEnd.line10c);
  const sold = sale === undefined ? 0 : (sale.line14b ?? sale.line13c);
  return held + sold;
}
