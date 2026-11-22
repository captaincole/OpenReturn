/* Form 1040 adjustments, AGI and deductions: lines 10 to 15. */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import { awaitsSchedule1A, standardDeduction } from "./deductions.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import type { Form1040 } from "./types.js";

type Form = FormAccessor<Form1040>;

const QUALIFIED_TIPS_GAP =
  "The return has employee cash tips, and the 2025 deduction for qualified tips (Schedule 1-A Part II) is not modeled: no fact says the tips came from a listed tipped occupation.";

// MANUAL EDIT: line 10 = Schedule 1 line 26; blank when Schedule 1 is not filed.
export function line10(form: Form) {
  const value = form["schedule-1.1.line.26"];
  return typeof value === "number" ? value : undefined;
}

// MANUAL EDIT: blank while line 9 is blank; sum() would leave only -line 10.
export const line11a = (form: Form) =>
  form["line.9"] === undefined
    ? undefined
    : sum(form["line.9"], form["line.10"] === undefined ? 0 : -form["line.10"]);

// MANUAL EDIT: a copy of line 11a, blank while it is blank.
export const line11b = (form: Form) => form["line.11a"];

export const line12bSpouseItemizesSeparate = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_separately" && info.spouseItemizesSeparately === true
    ? true
    : undefined;

export const line12dYouBornBeforeJan2_1961 = (_: unknown, info: Form1040FilingInfo) =>
  info.taxpayerBornBeforeJan2_1961 === true ? true : undefined;

/*
 * MANUAL EDIT: "were blind at the end of 2025, check the appropriate box(es)
 * on line 12d" (irs-1040-inst-2025::sec::line-12d::b01). The spouse box is
 * for a joint return only, as for the age box.
 */
export const line12dYouBlind = (_: unknown, info: Form1040FilingInfo) =>
  info.taxpayerBlind ? true : undefined;

/*
 * MANUAL EDIT: joint returns only. The MFS case (spouse had no income,
 * files no return) and a spouse's 2025 death are not modeled.
 */
export const line12dSpouseBornBeforeJan2_1961 = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_jointly" && info.spouseBornBeforeJan2_1961 === true
    ? true
    : undefined;

export const line12dSpouseBlind = (_: unknown, info: Form1040FilingInfo) =>
  info.filingStatus === "married_filing_jointly" && info.spouseBlind ? true : undefined;

/*
 * MANUAL EDIT: line 12e is the standard deduction, Schedule A line 17, or
 * the increased standard deduction on Schedule A line 16.
 * The worksheet for a filer someone can claim as a dependent is not modeled.
 */
export function line12e(form: Form, info: Form1040FilingInfo) {
  if (info.useItemizedDeductions === true) {
    const itemized = form["schedule-a.0.line.17_total_itemized_deductions"];
    return typeof itemized === "number" ? itemized : undefined;
  }
  // MANUAL EDIT: Exception 5 (irs-1040-inst-2025::sec::line-12c-2::b01): Schedule A line 16.
  if (info.increasedStandardDeduction !== false) {
    return numberOrBlank(form["schedule-a.0.line.16_other_itemized_deductions_amount"]);
  }
  return standardDeduction(info);
}

// MANUAL EDIT: line 13a = Form 8995 line 15 or Form 8995-A line 39; at most one files (whichForm.ts).
export function line13a(form: Form) {
  const value = form["form-8995.0.line.15"] ?? form["form-8995-a.1.line.39"];
  return typeof value === "number" ? value : undefined;
}

/*
 * MANUAL EDIT: line 13b = Schedule 1-A line 38; blank when Schedule 1-A is not filed.
 * Employee cash tips may be qualified tips (irs-1040-inst-2025::sec::part-ii::b01),
 * and Part II is not modeled, so the line shows the gap. A married filer
 * must file jointly to claim it, so a separate return has no gap.
 */
export function line13b(form: Form, info: Form1040FilingInfo) {
  if (info.employeeCashTips && info.filingStatus !== "married_filing_separately") {
    return unsupported(QUALIFIED_TIPS_GAP);
  }
  const value = form["schedule-1-a.1.line.38_total_additional_deductions"];
  return typeof value === "number" ? value : undefined;
}

/*
 * Blank when 12e is blank: sum() would count it as 0 and overstate
 * taxable income. Also blank while Schedule 1-A is filed but 13b is blank,
 * and while Form 8995 or 8995-A is filed but 13a (its line 15 or 39) is blank
 * (irs-1040-inst-2025::sec::line-13a::b01, irs-8995-inst-2025::sec::line-15::b01,
 * irs-8995a-inst-2025::sec::line-39::b01).
 */
export function line14(form: Form, info: Form1040FilingInfo) {
  const filesQbiForm =
    info.mustFile?.["form-8995"]?.value === true || info.mustFile?.["form-8995-a"]?.value === true;
  if (
    form["line.12e"] === undefined ||
    awaitsSchedule1A(info, form["line.13b"]) ||
    (filesQbiForm && form["line.13a"] === undefined)
  ) {
    return undefined;
  }
  return sum(form["line.12e"], form["line.13a"], form["line.13b"]);
}

/*
 * Blank when line 14 is blank: sum() would read it as 0 and tax all of 11b.
 * MANUAL EDIT: also blank when 11b is blank; sum() would give 0 taxable income.
 */
export const line15 = (form: Form) =>
  form["line.11b"] === undefined || form["line.14"] === undefined
    ? undefined
    : atLeast(0, sum(form["line.11b"], -form["line.14"]));
