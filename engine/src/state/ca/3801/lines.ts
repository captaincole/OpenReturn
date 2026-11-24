/*
 * FTB 3801 Side 1, Parts I to III: pure arithmetic on the Part IV and Part V
 * rows and federal modified AGI. The rules are federal Form 8582's
 * (ca-3801-inst-2025::sec::part-i::b01: "Get federal Form 8582 for specific
 * line instructions and examples"), in California amounts, with the California
 * text where it differs. A line is undefined when the form leaves it blank.
 */

import type { PassiveActivities, PassiveActivity } from "../../../federal/8582/activities.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../../money.js";

/* Line 5 (ca-3801-inst-2025::sec::part-ii::b01, "Line 5"). */
export const ALLOWANCE_THRESHOLD = 150000;
export const ALLOWANCE_THRESHOLD_MFS_APART = 75000;
/* Line 8: 50% of line 7, at most $25,000 (the form's text). */
export const ALLOWANCE_RATE = 0.5;
export const MAX_ALLOWANCE = 25000;
/*
 * Line 8 for married/RDP filing separately who lived apart all year: the
 * federal limit (irs-8582-inst-2025::sec::line-8::b01), which the California
 * text sends the reader to ("Get federal Form 8582 for line instructions",
 * ca-3801-inst-2025::sec::part-ii::b01). QUESTIONS.md item 2.
 */
export const MAX_ALLOWANCE_MFS_APART = 12500;

export interface Form3801Lines {
  line1a?: number;
  line1b?: number;
  line1c?: number;
  line1d?: number;
  line2a?: number;
  line2b?: number;
  line2c?: number;
  line2d?: number;
  line3?: number;
  line4?: number;
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
}

/* Who files and how: line 5's amount and whether Part II is open at all. */
export interface FilerStatus {
  marriedFilingSeparately: boolean;
  /* MFS only: lived apart from the spouse/RDP at all times in 2025. */
  livedApartAllYear?: boolean;
}

/* A column's total as Part IV or V prints it: blank when no row has an amount. */
function columnTotal(rows: PassiveActivity[], amount: (row: PassiveActivity) => number) {
  return sumOrBlank(...rows.map((row) => (amount(row) > 0 ? amount(row) : undefined)));
}

export interface PartTotals {
  netIncome?: number;
  netLoss?: number;
  priorUnallowedLoss?: number;
}

/* The total line of Part IV or Part V (columns (a), (b) and (c)). */
export function partTotals(rows: PassiveActivity[]): PartTotals {
  return {
    netIncome: columnTotal(rows, (row) => row.netIncome),
    netLoss: columnTotal(rows, (row) => row.netLoss),
    priorUnallowedLoss: columnTotal(rows, (row) => row.priorUnallowedLoss),
  };
}

/* Lines 1d and 2d: (a) less the parenthesized (b) and (c); signed, blank when all three are. */
function combined(totals: PartTotals): number | undefined {
  const { netIncome, netLoss, priorUnallowedLoss } = totals;
  if (sumOrBlank(netIncome, netLoss, priorUnallowedLoss) === undefined) return undefined;
  return sum(netIncome) - sum(netLoss) - sum(priorUnallowedLoss);
}

/*
 * Part II is open when lines 3 and 1d are losses (the form's line 3 text).
 * Married/RDP filing separately who lived together at any time are not
 * eligible (ca-3801-inst-2025::sec::part-ii::b01, "Line 5").
 */
export function partIIOpen(lines: Form3801Lines, filer: FilerStatus): boolean {
  if ((lines.line3 ?? 0) >= 0 || (lines.line1d ?? 0) >= 0) return false;
  return !filer.marriedFilingSeparately || filer.livedApartAllYear === true;
}

/* Lines 4 to 9; magi is line 6 before the zero floor, undefined while it waits. */
function partII(lines: Form3801Lines, filer: FilerStatus, magi: number | undefined): Form3801Lines {
  // "Otherwise, enter -0- on line 9 and go to line 10" (line 3); MFS together: "You must enter -0- on line 9".
  if (!partIIOpen(lines, filer)) return { line9: 0 };
  const line4 = Math.min(-sum(lines.line1d), -sum(lines.line3));
  const apart = filer.marriedFilingSeparately;
  const line5 = apart ? ALLOWANCE_THRESHOLD_MFS_APART : ALLOWANCE_THRESHOLD;
  if (magi === undefined) return { line4, line5 };
  const line6 = atLeast(0, magi);
  // "If line 6 is greater than or equal to line 5, skip line 7 and line 8, enter -0- on line 9."
  if (line6 >= line5) return { line4, line5, line6, line9: 0 };
  const line7 = line5 - line6;
  const cap = apart ? MAX_ALLOWANCE_MFS_APART : MAX_ALLOWANCE;
  const line8 = Math.min(roundDollars(line7 * ALLOWANCE_RATE), cap);
  return { line4, line5, line6, line7, line8, line9: Math.min(line4, line8) };
}

/*
 * Every line of Side 1. Line 3 income or zero: "all of your losses are
 * allowed" (ca-3801-inst-2025::sec::part-i::b01), so Parts II and III stay
 * blank. Line 10 adds lines 1a and 2a; line 11 adds lines 9 and 10.
 */
export function form3801Lines(
  parts: PassiveActivities,
  filer: FilerStatus,
  magi: number | undefined,
): Form3801Lines {
  const part4 = partTotals(parts.part4);
  const part5 = partTotals(parts.part5);
  const partI: Form3801Lines = {
    line1a: part4.netIncome,
    line1b: part4.netLoss,
    line1c: part4.priorUnallowedLoss,
    line1d: combined(part4),
    line2a: part5.netIncome,
    line2b: part5.netLoss,
    line2c: part5.priorUnallowedLoss,
    line2d: combined(part5),
  };
  partI.line3 = sumOrBlank(partI.line1d, partI.line2d);
  if (partI.line3 === undefined || partI.line3 >= 0) return partI;
  const lines = { ...partI, ...partII(partI, filer, magi) };
  lines.line10 = sumOrBlank(partI.line1a, partI.line2a);
  lines.line11 = lines.line9 === undefined ? undefined : sum(lines.line9, lines.line10);
  return lines;
}
