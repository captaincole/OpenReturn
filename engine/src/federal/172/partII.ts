/*
 * Form 172 Part II, the carryback of a 2025 farming loss to 2023 and 2024, as
 * pure functions of amounts (irs-172-inst-2025::sec::part-ii-nol-carryover and
 * the lines after it; the form). One column per carryback year; the 2024
 * column takes the 2023 column's line 10.
 */

import type { NolCarrybackYearValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { both, firstGap, isGap, type Amount } from "./lines.js";

/* Line 16: "Multiply line 13 by 7.5% (0.075)"; line 30: "Multiply line 22 by 10% (0.10)" (the form). */
export const MEDICAL_FLOOR_RATE = 0.075;
export const CASUALTY_FLOOR_RATE = 0.1;
/*
 * Line 26 refigures the deduction with line 24 as AGI. Cash gifts to 50% limit
 * organizations: "Deduct the contributions that don't exceed 60% of your AGI"
 * (irs-pub-526-2025::sec::how-to-figure-your-deduction-when::b01; the same
 * limit for 2023 and 2024).
 */
export const CASH_GIFT_LIMIT_RATE = 0.6;

export const OTHER_GIFTS_GAP =
  "Part II line 26: the carryback year had gifts other than cash to 60% limit organizations (noncash gifts, gifts to 30% or 20% limit organizations, or a carryover); the engine refigures only the 60% cash limit.";
export const ALTERNATE_AGI_GAP =
  "Part II line 26: the year deducted an NOL from another year (line 23) and had items figured from AGI (line 6), so the instructions refigure the gifts with another AGI that needs those items refigured without the NOL; the engine does not have that amount.";

export interface CarrybackColumn {
  line1: number;
  line2: number;
  line3?: number;
  line4?: number;
  line5?: number;
  line6?: number;
  line7?: Amount;
  line9: Amount;
  line10: Amount;
  /* Lines 11 to 33: only for a year that itemized, with line 3, 4 or 5 above 0. */
  itemized?: ItemizedAdjustmentLines;
}

export interface ItemizedAdjustmentLines {
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  line15: number;
  line16: number;
  line17: number;
  line18: number;
  line22: number;
  line23: number;
  line24: number;
  line25: number;
  line26: Amount;
  line27: Amount;
  line28: number;
  line29: number;
  line30: number;
  line31: number;
  line32: number;
  line33: Amount;
}

const whole = (value: number | undefined) => roundDollars(value ?? 0);
const shown = (value: number) => (value === 0 ? undefined : value);
const added = (first: number, second: number) => first + second;

/*
 * Line 26 (::line-26-refigured-charitable-contributions::b01): "Refigure your
 * charitable contributions using line 24 as your AGI unless" the year has an
 * amount on line 23 and items figured from AGI (taken as a line 6 adjustment
 * other than 0: QUESTIONS.md). Only cash gifts to 60% limit organizations are
 * refigured here.
 */
export function refiguredGifts(year: NolCarrybackYearValue, line24: number): Amount {
  const deducted = whole(year.charitableContributions);
  if (deducted === 0) return 0;
  if (year.otherGifts === true) return unsupported(OTHER_GIFTS_GAP);
  if (whole(year.nolDeducted) > 0 && whole(year.agiAdjustment) !== 0) {
    return unsupported(ALTERNATE_AGI_GAP);
  }
  const limit = roundDollars(CASH_GIFT_LIMIT_RATE * line24);
  return Math.min(whole(year.cashGiftsTo60PercentOrganizations), limit);
}

/*
 * Lines 11 to 33 (the form). Line 13 = line 11 + line 12, modified AGI. Lines
 * 19 to 21 stay blank: they take mortgage insurance premiums "for tax years
 * before 2022" (the form; ::line-20-refigured-mortgage-insurance::b01), and
 * the carryback years are 2023 and 2024. Line 33 combines lines 18, 21, 27
 * and 32.
 */
export function itemizedAdjustment(
  year: NolCarrybackYearValue,
  lines3To6: number,
): ItemizedAdjustmentLines {
  const line11 = whole(year.agi);
  const line12 = lines3To6;
  const line13 = line11 + line12;
  const line14 = whole(year.medicalAfterLimit);
  const line15 = whole(year.medicalBeforeLimit);
  const line16 = roundDollars(MEDICAL_FLOOR_RATE * line13);
  const line17 = atLeast(0, line15 - line16);
  const line18 = line14 - line17;
  const line22 = line13;
  const line23 = whole(year.nolDeducted);
  const line24 = line22 + line23;
  const line25 = whole(year.charitableContributions);
  const line26 = refiguredGifts(year, line24);
  const line27 = both(line25, line26, (claimed, refigured) => claimed - refigured);
  const line28 = whole(year.casualtyDeduction);
  const line29 = whole(year.casualtyBeforeLimit);
  const line30 = roundDollars(CASUALTY_FLOOR_RATE * line22);
  const line31 = atLeast(0, line29 - line30);
  const line32 = line28 - line31;
  const line33 = both(line27, line18 + line32, added);
  return {
    line11,
    line12,
    line13,
    line14,
    line15,
    line16,
    line17,
    line18,
    line22,
    line23,
    line24,
    line25,
    line26,
    line27,
    line28,
    line29,
    line30,
    line31,
    line32,
    line33,
  };
}

/*
 * DECISION (2026-11-26, by the author): line 3 takes the capital loss
 * deduction of the carryback year (its Schedule D line 21), not its net
 * long-term capital loss.
 * Text A, the line instruction: "Enter as a positive number the net long-term
 * capital loss, if any, shown (or as previously adjusted) on Schedule D (Form
 * 1040)" (irs-172-inst-2025::sec::line-3-net-capital-loss-deduction::b01).
 * Text B, the form's caption "Net capital loss deduction" (irs-172-face-2025)
 * and the rule for modified taxable income: "You cannot claim a deduction for
 * capital losses in excess of your capital gains"
 * (irs-172-inst-2025::sec::how-to-figure-an-nol-carryover::b01).
 * Line 2 is taxable income after the deduction, so only adding back the
 * deduction itself undoes it; the fact holds that amount (Text B).
 *
 * One column (::part-ii-nol-carryover::b01 and the line instructions). Line 6:
 * "If you entered an amount on line 3 or line 4, you must refigure" the items
 * figured from AGI; else blank. Line 7: "Skip this line if ... You didn't
 * itemize deductions; or The amounts on lines 3 through 5, are zero.
 * Otherwise, complete lines 11 through 33 and enter on line 7 the amount from
 * line 33." Line 8 is for estates and trusts only: blank. Line 9: "Combine
 * lines 2 through 8. If zero or less, enter -0-"; line 10: "subtract line 9
 * from line 1. If zero or less, enter -0-".
 */
export function carrybackColumn(line1: number, year: NolCarrybackYearValue): CarrybackColumn {
  const line2 = roundDollars(year.taxableIncome);
  const line3 = whole(year.netCapitalLossDeduction);
  const line4 = whole(year.section1202Exclusion);
  const line5 = whole(year.qbiDeduction);
  const refigures = line3 > 0 || line4 > 0;
  const line6 = refigures ? roundDollars(year.agiAdjustment ?? 0) : undefined;
  const lines3To6 = line3 + line4 + line5 + (line6 ?? 0);
  const itemized =
    year.itemized && (line3 > 0 || line4 > 0 || line5 > 0)
      ? itemizedAdjustment(year, lines3To6)
      : undefined;
  const line7 = itemized?.line33;
  const gap = firstGap([line7]);
  const line9: Amount = gap ?? atLeast(0, sum(line2, lines3To6, line7));
  const line10 = both(line9, line1, (modified, deduction) => atLeast(0, deduction - modified));
  return {
    line1,
    line2,
    line3: shown(line3),
    line4: shown(line4),
    line5: shown(line5),
    line6,
    line7,
    line9,
    line10,
    itemized,
  };
}

export interface CarrybackColumns {
  secondPreceding: CarrybackColumn;
  /* Undefined when the 2023 column absorbs the whole loss: "Use the next pair of columns ... if not fully absorbed". */
  firstPreceding?: CarrybackColumn;
  /* The 2023 column's line 10 is a gap, so the 2024 column cannot start. */
  firstPrecedingGap?: Unsupported;
}

/*
 * Line 1: "For the second preceding tax year, enter on line 1 the amount of
 * the current year farming loss carried back to the year. For the first
 * preceding tax year, enter on line 1 the amount from line 10 of Part II for
 * the second preceding tax year" (::line-1-nol-deduction::b01). A year whose
 * amounts are not stated yet is undefined.
 */
export function carrybackColumns(
  farmingLoss: number,
  secondPreceding: NolCarrybackYearValue | undefined,
  firstPreceding: NolCarrybackYearValue | undefined,
): CarrybackColumns | undefined {
  if (secondPreceding === undefined) return undefined;
  const first = carrybackColumn(farmingLoss, secondPreceding);
  const carried = first.line10;
  if (isGap(carried)) return { secondPreceding: first, firstPrecedingGap: carried };
  if (carried === 0) return { secondPreceding: first };
  if (firstPreceding === undefined) return undefined;
  return { secondPreceding: first, firstPreceding: carrybackColumn(carried, firstPreceding) };
}
