/*
 * Form 8582-CR lines 1a to 37: pure arithmetic on the form's lines
 * (irs-8582cr-face-2025::sec::face-part-i::b01 to face-part-v::b01). Each line
 * is a Cell: a gap in a line it reads makes it a gap too; blank (undefined) is
 * a line the form skips, and counts 0 where a later line reads it.
 */

import { atLeast, sumOrBlank } from "../../money.js";
import {
  figure,
  isGap,
  smallerOf,
  subtractedAtLeastZero,
  totalOf,
  valueOf,
  type Cell,
} from "../3800/cells.js";
import {
  ALLOWANCE_THRESHOLD,
  ALLOWANCE_THRESHOLD_MFS_APART,
  halfOfExcess,
  MAX_ALLOWANCE,
  MAX_ALLOWANCE_MFS_APART,
} from "../8582/specialAllowance.js";

/* Line 21: "Enter $250,000"; $125,000 for a separate return living apart (line-21::b01). */
export const REHABILITATION_THRESHOLD = 250_000;
export const REHABILITATION_THRESHOLD_MFS_APART = 125_000;
/* Line 21: skip lines 21 to 26 with Part II done and line 10 at $100,000 or less ($50,000) (line-21::b01). */
export const FULL_ALLOWANCE_MAGI = 100_000;
export const FULL_ALLOWANCE_MAGI_MFS_APART = 50_000;

export interface PartIAmounts {
  line1a?: number;
  line1b?: number;
  line2a?: number;
  line2b?: number;
  line3a?: number;
  line3b?: number;
  line4a?: number;
  line4b?: number;
}

/* What lines 6 to 36 read from the rest of the return. */
export interface ReturnAmounts {
  /* Line 6: the tax attributable to net passive income (line-6::b01). */
  line6: Cell;
  /* A separate return, living with the spouse at any time: Parts II to IV are skipped (face-part-i::b02). */
  livedWithSpouse: boolean;
  /* A separate return, living apart all year: the lower amounts of lines 9, 12, 21, 24 and 35. */
  mfsApart: boolean;
  /* Lines 10 and 22: modified AGI, not less than zero (line-10::b01). */
  magi: () => Cell;
  /* Lines 13, 25 and 35 line D: Form 8582 line 9, blank when it has none. */
  form8582Line9: Cell;
  /* The tax attributable to an amount: tax on taxable income less tax on taxable income less the amount. */
  taxAttributable: (amount: number) => Cell;
}

export type LineName =
  | `line${1 | 2 | 3 | 4}${"a" | "b" | "c"}`
  | `line${5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19}`
  | `line${20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29}`
  | `line${30 | 31 | 32 | 33 | 34 | 35 | 36 | 37}`;
export type Form8582CRLines = Partial<Record<LineName, Cell>>;

/* Part I (face-part-i::b01, ::b02): lines 1c to 4c add (a) and (b); line 5 adds them; line 7 subtracts line 6. */
export function partI(amounts: PartIAmounts, line6: Cell): Form8582CRLines {
  const line1c = sumOrBlank(amounts.line1a, amounts.line1b);
  const line2c = sumOrBlank(amounts.line2a, amounts.line2b);
  const line3c = sumOrBlank(amounts.line3a, amounts.line3b);
  const line4c = sumOrBlank(amounts.line4a, amounts.line4b);
  const line5 = totalOf(line1c, line2c, line3c, line4c);
  return {
    ...amounts,
    line1c,
    line2c,
    line3c,
    line4c,
    line5,
    line6,
    line7: subtractedAtLeastZero(line5, line6),
  };
}

const hasAmount = (cell: Cell) => typeof cell === "number" && cell > 0;

/* Part II (face-part-ii::b01; line-9::b01, line-12::b01): only with an amount on line 1c. */
export function partII(lines: Form8582CRLines, inputs: ReturnAmounts): Form8582CRLines {
  const line8 = smallerOf(lines.line1c, lines.line7);
  const line9 = inputs.mfsApart ? ALLOWANCE_THRESHOLD_MFS_APART : ALLOWANCE_THRESHOLD;
  const line10 = inputs.magi();
  if (isGap(line10)) return { line8, line9, line10, line16: line10 };
  // "If line 10 is equal to or more than line 9, skip lines 11 through 15 and enter -0- on line 16."
  if (valueOf(line10) >= line9) return { line8, line9, line10, line16: 0 };
  const line11 = line9 - valueOf(line10);
  const line12 = halfOfExcess(line11, inputs.mfsApart ? MAX_ALLOWANCE_MFS_APART : MAX_ALLOWANCE);
  const line13 = inputs.form8582Line9;
  const line14 = subtractedAtLeastZero(line12, line13);
  const line15 = taxOn(inputs, line14);
  const line16 = smallerOf(line8, line15);
  return { line8, line9, line10, line11, line12, line13, line14, line15, line16 };
}

/* The tax attributable to a line's amount; a gap passes through. */
function taxOn(inputs: ReturnAmounts, amount: Cell): Cell {
  return isGap(amount) ? amount : inputs.taxAttributable(valueOf(amount));
}

/*
 * Lines 21 to 27, and whether lines 23 to 29 are skipped. Line 27 is line 15
 * when line 21's skip rule applies (line-21::b01).
 */
function lines21To27(
  lines: Form8582CRLines,
  inputs: ReturnAmounts,
): { lines: Form8582CRLines; skipTo30: boolean } {
  const fullAllowance = inputs.mfsApart ? FULL_ALLOWANCE_MAGI_MFS_APART : FULL_ALLOWANCE_MAGI;
  const partIIDone = lines.line10 !== undefined;
  if (partIIDone && !isGap(lines.line10) && valueOf(lines.line10) <= fullAllowance) {
    return { lines: { line27: lines.line15 }, skipTo30: false };
  }
  const line21 = inputs.mfsApart ? REHABILITATION_THRESHOLD_MFS_APART : REHABILITATION_THRESHOLD;
  const line22 = inputs.magi();
  if (isGap(line22)) return { lines: { line21, line22, line27: line22 }, skipTo30: false };
  // "If line 22 is equal to or more than line 21, skip lines 23 through 29 and enter -0- on line 30."
  if (valueOf(line22) >= line21) return { lines: { line21, line22 }, skipTo30: true };
  const line23 = line21 - valueOf(line22);
  const line24 = halfOfExcess(line23, inputs.mfsApart ? MAX_ALLOWANCE_MFS_APART : MAX_ALLOWANCE);
  const line25 = inputs.form8582Line9;
  const line26 = subtractedAtLeastZero(line24, line25);
  const line27 = taxOn(inputs, line26);
  return { lines: { line21, line22, line23, line24, line25, line26, line27 }, skipTo30: false };
}

/* Part III (face-part-iii::b01, ::b02): only with an amount on line 2c. */
export function partIII(lines: Form8582CRLines, inputs: ReturnAmounts): Form8582CRLines {
  const line17 = lines.line7;
  const line18 = totalOf(lines.line16);
  const line19 = subtractedAtLeastZero(line17, line18);
  // "If zero, enter -0- here and on lines 30 and 36, and then go to Part V."
  if (line19 === 0) return { line17, line18, line19, line30: 0, line36: 0 };
  const line20 = smallerOf(lines.line2c, line19);
  const upper = lines21To27(lines, inputs);
  if (upper.skipTo30) return { line17, line18, line19, line20, ...upper.lines, line30: 0 };
  const line28 = line18;
  const line29 = subtractedAtLeastZero(upper.lines.line27, line28);
  const line30 = smallerOf(line20, line29);
  return { line17, line18, line19, line20, ...upper.lines, line28, line29, line30 };
}

/*
 * Line 35 (line-35::b01): the tax attributable to $25,000 ($12,500) less Form
 * 8582 line 9, less lines 16 and 30. The lines before it allow no more than
 * that tax, so line J is not below zero; the floor only guards the arithmetic.
 */
export function line35Of(lines: Form8582CRLines, inputs: ReturnAmounts): Cell {
  const lineC = inputs.mfsApart ? MAX_ALLOWANCE_MFS_APART : MAX_ALLOWANCE;
  const lineE = subtractedAtLeastZero(lineC, inputs.form8582Line9);
  const lineH = taxOn(inputs, lineE);
  const lineI = totalOf(lines.line16, lines.line30);
  return figure((tax, used) => atLeast(0, tax - used), lineH, lineI);
}

/* Part IV (face-part-iv::b01): only with an amount on line 3c. */
export function partIV(lines: Form8582CRLines, inputs: ReturnAmounts): Form8582CRLines {
  const partIIIDone = lines.line19 !== undefined;
  // Line 19 at zero: "enter -0- here and on lines 30 and 36".
  if (partIIIDone && lines.line19 === 0) return { line36: 0 };
  const line31 = partIIIDone
    ? lines.line19
    : figure((seven, sixteen) => seven - sixteen, lines.line7, lines.line16);
  const line32 = totalOf(lines.line30);
  const line33 = subtractedAtLeastZero(line31, line32);
  // "If zero, enter -0- here and on line 36."
  if (line33 === 0) return { line31, line32, line33, line36: 0 };
  const line34 = smallerOf(lines.line3c, line33);
  const line35 = line35Of(lines, inputs);
  return { line31, line32, line33, line34, line35, line36: smallerOf(line34, line35) };
}

/*
 * Lines 1a to 37. Line 37 adds lines 6, 16, 30 and 36. A separate return
 * living with the spouse skips Parts II to IV (face-part-i::b02).
 *
 * DECISION (2026-11-26, by the author): with line 7 at zero, line 37 is line 5.
 * - The form, line 37: "Passive Activity Credit Allowed. Add lines 6, 16, 30,
 *   and 36" (irs-8582cr-face-2025::sec::face-part-v::b01), which gives line 6,
 *   more than the credits when line 6 is above line 5.
 * - The instructions, line 7: "If line 7 is zero because the tax on the net
 *   passive income on line 6 is greater than your credits from passive
 *   activities on line 5, all your credits from passive activities are
 *   allowed. In this case, enter the amount from line 5 on line 37"
 *   (irs-8582cr-inst-2025::sec::line-7::b01); the face's line 7 says "enter
 *   -0- and see instructions" (face-part-i::b02).
 * The engine follows the line 7 instruction: the credit allowed cannot be more
 * than the credits there are. The special allowance parts then have nothing
 * left to allow, so they stay blank (QUESTIONS.md).
 */
export function form8582CRLines(amounts: PartIAmounts, inputs: ReturnAmounts): Form8582CRLines {
  let lines = partI(amounts, inputs.line6);
  if (isGap(lines.line7)) return { ...lines, line37: lines.line7 };
  if (lines.line7 === 0) return { ...lines, line37: lines.line5 };
  if (!inputs.livedWithSpouse) {
    if (hasAmount(lines.line1c)) lines = { ...lines, ...partII(lines, inputs) };
    if (hasAmount(lines.line2c)) lines = { ...lines, ...partIII(lines, inputs) };
    if (hasAmount(lines.line3c)) lines = { ...lines, ...partIV(lines, inputs) };
  }
  return {
    ...lines,
    line37: totalOf(lines.line6, lines.line16, lines.line30, lines.line36),
  };
}
