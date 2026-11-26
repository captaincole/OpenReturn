/*
 * FTB 3801-CR lines 1a to 17: pure arithmetic on the form's lines. Lines 1a to
 * 16 are federal Form 8582-CR lines 1a to 16, line for line (the same text and
 * amounts on the face: $150,000 or $75,000 on line 9, 50% capped at $25,000 or
 * $12,500 on line 12), so they are the federal rules (federal/8582-cr/lines.ts).
 * "Generally, California law is the same as federal law concerning passive
 * activity credit limitations" (ca-3801cr-inst-2025::sec::b-special-note::b01).
 * Each line is a Cell: a gap passes through; blank is a line the form skips.
 */

import {
  isGap,
  smallerOf,
  subtractedAtLeastZero,
  totalOf,
  type Cell,
} from "../../../federal/3800/cells.js";
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
 * The low-income housing credit allowed beyond line 6: the smaller of line 2c
 * plus line 3c, and line 7 less line 16, with no dollar limit (the DECISION
 * below). Line 2c takes it first, then line 3c, as federal Form 8582-CR Part III comes
 * before Part IV. The two amounts are named for the federal lines 30 and 36,
 * which Worksheets 6 and 7 share (federal/8582-cr/allocation.ts). A separate
 * return that lived with the spouse has these credits on line 4 (Worksheet 4,
 * ca-3801cr-inst-2025::sec::line-2a-through-line-2c::b01), so it gets none.
 */
export function lowIncomeHousingOffsetOf(
  lines: Pick<Form8582CRLines, "line2c" | "line3c" | "line7" | "line16">,
): Pick<Form8582CRLines, "line30" | "line36"> {
  const room = subtractedAtLeastZero(lines.line7, lines.line16);
  const line30 = smallerOf(lines.line2c, room);
  const line36 = smallerOf(lines.line3c, subtractedAtLeastZero(room, line30));
  return { line30, line36 };
}

/*
 * Lines 1a to 17. Part II only with an amount on line 1c ("Complete Part II
 * if you have an amount on line 1c", the face), and not for a separate return
 * that lived with the spouse at any time (ca-3801cr-inst-2025::sec::line-9::b01).
 * Line 17: "Add line 6 and line 16" (the face), plus the low-income housing
 * credit allowed beyond line 6.
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
 * DECISION (2026-11-26, by the author): a low-income housing credit (lines 2c
 * and 3c) gets the rental real estate offset with no dollar limit.
 * - Text A, Important Information: "For taxable years beginning on or after
 *   January 1, 2020, the dollar limitation for the offset for rental real
 *   estate activities shall not apply to the low-income housing credit
 *   program. For more information, see California Revenue & Taxation Code
 *   (R&TC) Section 17561(d)(1)"
 *   (ca-3801cr-inst-2025::sec::rental-real-estate-activities::b01). R&TC
 *   section 17561(d)(1) and (d)(2), as the lead read a public copy on
 *   2026-11-26 (the Code is not in the library): for section 469(i), the
 *   section 469(i)(2) dollar limitation does not apply to the section 17058
 *   low-income housing credit, for taxable years beginning on or after
 *   January 1, 2020.
 * - Text B, the face: Part II takes only line 1c ("Complete Part II if you
 *   have an amount on line 1c"; line 8 "Enter the smaller of line 1c or line
 *   7", ca-3801cr-face-2025::sec::face-part-ii::b01), and line 17 reads
 *   "Passive Activity Credits Allowed. Add line 6 and line 16. See
 *   instructions if you have any credits from a publicly traded partnership"
 *   (ca-3801cr-face-2025::sec::face-part-iii::b01).
 * The engine follows Text A: the form's own instructions and the statute both
 * say the dollar limit does not apply, and the form has no line to show it, so
 * the engine adds the amount on line 17, the form's total of credits allowed,
 * beyond what its label adds. The label's "See instructions" is about a
 * publicly traded partnership and does not support this; the instructions'
 * Important Information and the statute do. The form's arithmetic alone
 * would deny a credit the law allows (a $12,000
 * credit with no net passive income is allowed up to $12,000, not $0).
 * Lines 8 to 16 are unchanged. The tax limit of Schedule P (540) Section B2, or
 * of Form 540 lines 43 to 45, still applies after this form (creditUsed.ts).
 */
export function form3801CRLines(amounts: PartIAmounts, inputs: CaReturnAmounts): Form3801CRLines {
  let lines: Form8582CRLines = partI(amounts, inputs.line6);
  if (isGap(lines.line7)) return { ...lines, line17: lines.line7 };
  if (lines.line7 === 0) return { ...lines, line17: lines.line5 };
  if (!inputs.livedWithSpouse && hasAmount(lines.line1c)) {
    lines = { ...lines, ...partII(lines, inputs) };
  }
  const housing = lowIncomeHousingOffsetOf(lines);
  return { ...lines, line17: totalOf(lines.line6, lines.line16, housing.line30, housing.line36) };
}
