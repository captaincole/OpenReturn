/*
 * FTB 3801-CR lines 1a to 17: pure arithmetic on the form's lines. Lines 1a to
 * 16 are federal Form 8582-CR lines 1a to 16, line for line (the same text and
 * amounts on the face: $150,000 or $75,000 on line 9, 50% capped at $25,000 or
 * $12,500 on line 12), so they are the federal rules (federal/8582-cr/lines.ts).
 * "Generally, California law is the same as federal law concerning passive
 * activity credit limitations" (ca-3801cr-inst-2025::sec::b-special-note::b01).
 * Each line is a Cell: a gap passes through; blank is a line the form skips.
 */

import { isGap, totalOf, type Cell } from "../../../federal/3800/cells.js";
import {
  partI,
  partII,
  type Form8582CRLines,
  type PartIAmounts,
  type ReturnAmounts,
} from "../../../federal/8582-cr/lines.js";

export type { PartIAmounts };

/*
 * What lines 6, 10, 13 and 15 read. form8582Line9 holds FTB 3801 line 9 here:
 * "Enter the amount, if any, from line 9 of form FTB 3801" (the face, line 13).
 */
export type CaReturnAmounts = ReturnAmounts;

export type Form3801CRLines = Pick<
  Form8582CRLines,
  | `line${1 | 2 | 3 | 4}${"a" | "b" | "c"}`
  | `line${5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17}`
>;

const hasAmount = (cell: Cell) => typeof cell === "number" && cell > 0;

/*
 * Lines 1a to 17. Part II only with an amount on line 1c ("Complete Part II
 * if you have an amount on line 1c", the face), and not for a separate return
 * that lived with the spouse at any time (ca-3801cr-inst-2025::sec::line-9::b01).
 * Line 17: "Add line 6 and line 16" (the face).
 *
 * DECISION (2026-11-26, by the author): with line 7 at zero, line 17 is line 5.
 * - The face, line 17: "Passive Activity Credits Allowed. Add line 6 and line
 *   16", which gives line 6, more than the credits, when line 6 is above line 5.
 * - The instructions, line 7: "If line 7 is zero because the tax on net
 *   passive income on line 6 is more than your credits from passive activities
 *   on line 5, all of your passive activity credits are allowed. In this case,
 *   enter the amount from line 5 on line 17" (ca-3801cr-inst-2025::sec::line-7::b01).
 * The engine follows the line 7 instruction, as federal Form 8582-CR does
 * (row A44): the credit allowed is never more than the credits there are.
 * Part II then has nothing left to allow, so it stays blank.
 *
 * DECISION (2026-11-26, by the author): a low-income housing credit (lines 2
 * and 3) is allowed only through line 6.
 * - Important Information: "For taxable years beginning on or after January 1,
 *   2020, the dollar limitation for the offset for rental real estate
 *   activities shall not apply to the low-income housing credit program"
 *   (ca-3801cr-inst-2025::sec::rental-real-estate-activities::b01).
 * - The face: Part II takes only line 1c ("Complete Part II if you have an
 *   amount on line 1c"; line 8 "Enter the smaller of line 1c or line 7"), and
 *   line 17 adds only lines 6 and 16; the form has no part for lines 2c and 3c.
 * The engine follows the form's lines: the form's arithmetic wins over a
 * sentence whose amount its lines cannot produce (docs/rule-decisions.md).
 */
export function form3801CRLines(amounts: PartIAmounts, inputs: CaReturnAmounts): Form3801CRLines {
  let lines: Form8582CRLines = partI(amounts, inputs.line6);
  if (isGap(lines.line7)) return { ...lines, line17: lines.line7 };
  if (lines.line7 === 0) return { ...lines, line17: lines.line5 };
  if (!inputs.livedWithSpouse && hasAmount(lines.line1c)) {
    lines = { ...lines, ...partII(lines, inputs) };
  }
  return { ...lines, line17: totalOf(lines.line6, lines.line16) };
}
