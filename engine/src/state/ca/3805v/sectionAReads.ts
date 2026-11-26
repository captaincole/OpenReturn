/*
 * Part I Section A's reads: Form 540 lines 17 and 18, and the return's amounts
 * sorted into business and nonbusiness (ca-3805v-inst-2025::sec::general-information::b09,
 * ::section-a-california-residents::b01, ::b02). Each Schedule CA (540) line
 * counts in California amounts, column A less column B plus column C.
 */

import { sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import { SECTION_1231_ROW, type ScheduleDCaFigures } from "../schedule-d-ca/lines.js";
import {
  CA_AGI,
  caAmount,
  carryoverDeductions,
  deductionOf,
  itemizes,
  type Info,
  type Read,
} from "./figures.js";
import { sectionA, type Amount, type SectionAInputs, type SectionALines } from "./lines.js";

/*
 * Line 9: "income that is not related to a trade or business (such as
 * dividends, pensions, annuities, income from an endowment, or interest earned
 * on investments)". Schedule CA lines 2 (interest), 3 (dividends), 4 (IRA
 * distributions), 5 (pensions and annuities), 6 (social security), Section B
 * line 1 (taxable refunds), line 2a (alimony received) and line 8b (gambling).
 * Unemployment compensation is business income (federal Form 172). QUESTIONS.md.
 */
const NONBUSINESS_INCOME_LINES = [
  "0.line.2b",
  "0.line.3b",
  "0.line.4b",
  "0.line.5b",
  "0.line.6b",
  "0.line.b1",
  "0.line.b2a",
  "1.line.b8b",
] as const;

/*
 * Line 8 adjustments: deductions "not related to a trade or business and ...
 * not related to your employment (such as ... alimony, ... and your
 * contributions to individual retirement plans)". Schedule CA lines 13 (HSA),
 * 16 (self-employed retirement plans), 18 (penalty on early withdrawal of
 * savings), 19a (alimony paid), 20 (IRA), 21 (student loan interest) and 23
 * (Archer MSA). Lines 11, 12, 14, 15 and 17 are business. QUESTIONS.md.
 */
const NONBUSINESS_ADJUSTMENT_LINES = [
  "2.line.c13",
  "2.line.c16",
  "2.line.c18",
  "2.line.c19a",
  "2.line.c20",
  "2.line.c21",
  "2.line.c23",
] as const;

export const DISASTER_2025_GAP =
  "The California itemized deductions include a casualty loss: the part that is a 2025 declared disaster loss (line 3b), its disaster code and Part III line 3 are not modeled, and the instructions do not settle the line 3 balance (QUESTIONS.md).";
const OTHER_INCOME_GAP =
  "Schedule CA line 9a holds other income (lines 8c to 8z, besides the excess business loss adjustment) that the instructions do not sort into business and nonbusiness income.";
const OTHER_ADJUSTMENTS_GAP =
  "Schedule CA line 25 holds other adjustments (lines 24a to 24z) that the instructions do not sort into business and nonbusiness deductions.";
const UNCOPIED_ADJUSTMENTS_GAP =
  "Schedule 1 line 26 holds an adjustment that Schedule CA Section C does not copy, so line 8 cannot sort it.";
const EMPLOYEE_EXPENSES_GAP =
  "The itemized deductions include unreimbursed employee expenses (Schedule CA line 19), which are business deductions under the 2% floor with the nonbusiness ones; the instructions do not split the floor.";
export const CAPITAL_LIST_GAP =
  "The California capital gain or loss on Schedule CA line 7a is not the total of the sales, distributions and carryover the engine lists for Schedule D (540) (a K-1 capital amount, for one), so lines 4, 5, 13, 14, 18 and 19 cannot be sorted.";

type CapitalInputs = Pick<
  SectionAInputs,
  | "nonbusinessCapitalLosses"
  | "nonbusinessCapitalGains"
  | "businessCapitalLosses"
  | "businessCapitalGains"
  | "scheduleDLoss"
  | "capitalLossDeduction"
>;

const everyCapitalLine = (value: Amount): CapitalInputs => ({
  nonbusinessCapitalLosses: value,
  nonbusinessCapitalGains: value,
  businessCapitalLosses: value,
  businessCapitalGains: value,
  scheduleDLoss: value,
  capitalLossDeduction: value,
});

/*
 * Lines 4, 5, 13, 14, 18 and 19 from Schedule D (540). Sales of stock and other
 * investments, capital gain distributions and the carryover are nonbusiness
 * (::general-information::b09); the Schedule D-1 row, a section 1231 gain from
 * property used in a trade or business, is a business capital gain; no row is
 * a business capital loss (a section 1231 loss is ordinary). Line 4 takes
 * Schedule D (540) line 7, the carryover with the 2025 losses (QUESTIONS.md).
 * Undefined while the schedule waits.
 */
function capitalInputs(form: Read, capital: ScheduleDCaFigures): CapitalInputs | undefined {
  if (capital.gap) return everyCapitalLine(unsupported(capital.gap));
  if (capital.line8 === undefined || capital.line11 === undefined) return undefined;
  if (capital.line11 !== caAmount(form, "0.line.7a"))
    return everyCapitalLine(unsupported(CAPITAL_LIST_GAP));
  const business = sum(
    ...capital.line1.filter((row) => row.description === SECTION_1231_ROW).map((row) => row.gain),
  );
  return {
    nonbusinessCapitalLosses: sum(capital.line7),
    nonbusinessCapitalGains: sum(capital.line4) - business,
    businessCapitalLosses: 0,
    businessCapitalGains: business,
    scheduleDLoss: capital.line8 < 0 ? -capital.line8 : 0,
    capitalLossDeduction: sum(capital.line9),
  };
}

/*
 * Line 8: Form 540 line 18 (the standard deduction, or the itemized deductions
 * less a casualty loss: "A casualty loss is considered a 'business expense'"),
 * plus the nonbusiness adjustments.
 */
function nonbusinessDeductions(form: Read, deduction: number): Amount {
  const itemizing = itemizes(form, deduction);
  if (itemizing && sum(form["schedule-ca.5.page2.job_expenses_19"]) > 0)
    return unsupported(EMPLOYEE_EXPENSES_GAP);
  const federalAdjustments = sum(form["schedule-1.1.line.26"]);
  if (federalAdjustments !== 0 && typeof form["schedule-ca.3.line.c26_federal"] !== "number")
    return unsupported(UNCOPIED_ADJUSTMENTS_GAP);
  if (caAmount(form, "3.line.c25") !== 0) return unsupported(OTHER_ADJUSTMENTS_GAP);
  const casualty = itemizing ? caAmount(form, "5.page2.casualty_15") : 0;
  return (
    deduction - casualty + sum(...NONBUSINESS_ADJUSTMENT_LINES.map((line) => caAmount(form, line)))
  );
}

/* Line 9; the gap when line 9a holds other income the instructions do not sort. */
function nonbusinessIncome(form: Read): Amount {
  const other =
    caAmount(form, "2.line.b9a") - caAmount(form, "1.line.b8b") - caAmount(form, "1.line.b8p");
  if (other !== 0) return unsupported(OTHER_INCOME_GAP);
  return sum(...NONBUSINESS_INCOME_LINES.map((line) => caAmount(form, line)));
}

/*
 * Line 3b: none, or the gap when the itemized deductions hold a casualty loss.
 * With line 3a (Form 540 line 17 less line 18) at 0 or more, line 3b is not
 * figured: "If positive, enter 0 here and on line 25. Do not complete the rest
 * of Section A" (ca-3805v-face-2025::sec::face-part-i::b01), and income absorbed
 * the loss, so Part III line 3 has nothing to carry.
 */
export function disasterLossOf(form: Read, agi: number, deduction: number): Amount {
  if (agi - deduction >= 0) return 0;
  const casualty = caAmount(form, "5.page2.casualty_15");
  return itemizes(form, deduction) && casualty > 0 ? unsupported(DISASTER_2025_GAP) : 0;
}

/*
 * DECISION (2026-11-25, by the author): line 23 adds back the NOL and disaster
 * loss carryover deductions taken in 2025 (Schedule CA lines 9b1 and 9b2, the
 * column (f) totals of Part III line 2), not the whole carryover.
 * Text A, the line instruction: "Enter the amount of your prior year NOL and
 * disaster loss carryover from your 2024 form FTB 3805V, Part III, line 5 and
 * line 6" (ca-3805v-inst-2025::sec::section-a-california-residents::b02).
 * Text B, the form's arithmetic: line 1 is Form 540 line 17, which the
 * deductions taken reduce, and "The California NOL is generally figured the
 * same way as the federal NOL" (::b-nols::b01), whose line for these losses is
 * the NOL deduction from other years (federal Form 172 Part I line 23).
 * Adding back the whole carryover would cancel a 2025 NOL by a carryover that
 * 2025 did not use; the line restores what line 1 subtracted, so Text B.
 *
 * Section A, for a Form 540 return (blank on Form 540NR: "Nonresidents and
 * Part-Year Residents Only, go to Section B"). Undefined when the form does not
 * file or while a line waits.
 */
export function sectionALinesOf(form: Read, info: Info): SectionALines | Unsupported | undefined {
  const figures = info.form3805v;
  if (figures === undefined || figures.gap) return undefined;
  const agi = form[CA_AGI];
  const deduction = deductionOf(form, info);
  if (deduction === undefined || isUnsupportedResult(deduction)) return deduction;
  const carryovers = carryoverDeductions(form, info);
  if (typeof agi !== "number" || carryovers === undefined) return undefined;
  const capital = capitalInputs(form, figures.capital);
  if (capital === undefined && agi < deduction) return undefined;
  return sectionA({
    agi,
    deduction,
    disasterLoss: disasterLossOf(form, agi, deduction),
    ...(capital ?? everyCapitalLine(0)),
    nonbusinessDeductions: nonbusinessDeductions(form, deduction),
    nonbusinessIncome: nonbusinessIncome(form),
    carryoverDeductions: isUnsupportedResult(carryovers)
      ? carryovers
      : carryovers.disasterUsed + carryovers.nolUsed,
  });
}
