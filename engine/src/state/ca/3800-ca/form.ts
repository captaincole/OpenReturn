/*
 * FTB 3800 from the child's return and the answers. Every read is by full
 * field id, so Form 540 line 31 can call childTaxOnLine31 with its own accessor.
 */

import { lookupStandardDeduction } from "../../../data/standardDeduction.js";
import { atLeast, numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { FilingStatus } from "../../../values.js";
import type { Form3800CaAnswers, Form3800CaFilingInfo } from "./filingInfo.js";
import { line1, line10, line18, line2, line6, line9Form540NR, lines12And13 } from "./lines.js";
import { californiaTaxOn } from "./tax.js";

/* Any form's accessor: these functions read fields by their full id only. */
export type Accessor = { readonly [fieldId: string]: unknown };

export interface PartII {
  line6: number;
  line7?: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12a?: number;
  line12b?: number;
  line13: number;
}

export interface PartIII {
  line14: number;
  line15: number;
  line16: number;
  line17: number;
  line18: number;
}

export interface Form3800CaLines {
  line1: number;
  line2: number;
  line3: number;
  /* Absent when line 3 is zero or less: "stop here" (the blank form). */
  line4?: number;
  line5?: number;
  /* Absent when line 5 is zero or less: "stop here". */
  partII?: PartII;
  partIII?: PartIII;
}

const ITEMIZED_WITHOUT_AMOUNT =
  "Line 2: the child itemizes on Form 540 with no itemizing decision, so the part of Form 540 line 18 directly connected with the unearned income (child_unearned_income.ca_itemized_for_unearned_income) was never asked (ca-3800-inst-2025::sec::part-i-child-s-net-unearned-income::b02).";

const amount = (form: Accessor, id: string) => numberOrBlank(form[id]) ?? 0;

/* A federal line with its Schedule CA columns: federal, less column B, plus column C. */
const californiaAmount = (form: Accessor, federalId: string, scheduleCaLine: string) =>
  amount(form, federalId) -
  amount(form, `schedule-ca.0.line.${scheduleCaLine}_subtractions`) +
  amount(form, `schedule-ca.0.line.${scheduleCaLine}_additions`);

/*
 * Line 1 worksheet line 2: "wages, tips, and other payments received for
 * personal services performed" (::part-i-child-s-net-unearned-income::b02), as
 * California taxes them: wages (Form 1040 line 1z) and business and farm
 * profit (Schedule 1 lines 3 and 6, a loss as 0), each with its Schedule CA
 * adjustments (QUESTIONS.md).
 *
 * DECISION (2026-11-24, by the author, not reviewed by a person): line 1 is
 * the FTB worksheet's Form 540 line 17 less earned income, with no 30% limit
 * and no Alternate Worksheet. ca-3800-inst-2025::sec::part-i-child-s-net-unearned-income::b02:
 * "Enter the child's earned income (wages, tips, and other payments received
 * for personal services performed)". ::part-i-child-s-net-unearned-income::b01:
 * "In most cases, this will be the same as the amount entered on federal Form
 * 8615", whose Alternate Worksheet adds back "any net loss from
 * self-employment" (irs-8615-inst-2025::sec::alternate-worksheet-for-form-8615-line-1::b01).
 * The engine follows the FTB worksheet, because a form's own instructions
 * decide how that form is filled.
 */
function californiaEarnedIncome(form: Accessor): number {
  return (
    californiaAmount(form, "form-1040.line.1z", "1z") +
    atLeast(0, californiaAmount(form, "schedule-1.0.line.3", "b3")) +
    atLeast(0, californiaAmount(form, "schedule-1.0.line.6", "b6"))
  );
}

/* The child's Form 540 as the form reads it; undefined while a line it needs is blank. */
function childReturn(form: Accessor) {
  const californiaAgi = numberOrBlank(form["form-540.line.17_ca_agi"]);
  const deductions = numberOrBlank(form["form-540.line.18_deductions"]);
  const taxableIncome = numberOrBlank(form["form-540.line.19_taxable_income"]);
  if (californiaAgi === undefined || deductions === undefined || taxableIncome === undefined) {
    return undefined;
  }
  return { californiaAgi, deductions, taxableIncome, earnedIncome: californiaEarnedIncome(form) };
}

/* The child itemized: Form 540 line 18 is more than the California standard deduction. */
function itemizes(deductions: number, filingStatus: FilingStatus): boolean {
  const standard = lookupStandardDeduction("state-ca", 2025, filingStatus);
  return standard !== undefined && deductions > standard;
}

/* Line 9: the table or schedules on line 8; the Form 540NR worksheet for such a parent. */
function line9Of(answers: Form3800CaAnswers, line5: number, line8: number): number {
  const status = answers.parentFilingStatus;
  const taxOn = (value: number) => californiaTaxOn(value, status);
  const { parent } = answers;
  if (parent.returnForm !== "540nr" || parent.form540NR === undefined) return taxOn(line8);
  const others = parent.otherChildren ?? [];
  return line9Form540NR(
    {
      childCaliforniaNetUnearnedIncome: line5,
      line5,
      parentCaliforniaAgi: parent.form540NR.californiaAdjustedGrossIncome,
      parentAgi: parent.form540NR.adjustedGrossIncome,
      parentDeductions: parent.form540NR.deductions,
      otherChildrenCaliforniaNetUnearnedIncome: sum(
        ...others.map((other) => other.californiaNetUnearnedIncome ?? other.netUnearnedIncome),
      ),
      otherChildrenNetUnearnedIncome: sum(...others.map((other) => other.netUnearnedIncome)),
    },
    taxOn,
  );
}

/* Line 10 from the parent's return. */
function line10Of(answers: Form3800CaAnswers): number {
  const { parent } = answers;
  const nonresident = parent.returnForm === "540nr" ? parent.form540NR : undefined;
  return line10({
    tax: parent.tax,
    ftb3803Tax: parent.ftb3803Tax ?? 0,
    form540NR: nonresident && {
      taxOnTotalTaxableIncome: nonresident.taxOnTotalTaxableIncome,
      totalTaxableIncome: parent.taxableIncome,
      californiaTaxableIncome: nonresident.californiaTaxableIncome,
    },
  });
}

/* Lines 6 through 13 (::part-ii-tentative-tax-based-on-parent-s-tax-rate::b01 to ::b04). */
function partII(line5: number, answers: Form3800CaAnswers): PartII {
  const others = answers.parent.otherChildren ?? [];
  const otherTotal = sum(...others.map((other) => other.netUnearnedIncome));
  // Line 7: "the total net unearned income, if any"; blank when none.
  const line7 = otherTotal > 0 ? otherTotal : undefined;
  const sixth = line6(answers.parent.taxableIncome);
  const line8 = line5 + sixth + (line7 ?? 0);
  const line9 = line9Of(answers, line5, line8);
  const tenth = line10Of(answers);
  const line11 = line9 - tenth;
  return {
    line6: sixth,
    line7,
    line8,
    line9,
    line10: tenth,
    line11,
    ...lines12And13(line5, line7, line11),
  };
}

/* Lines 14 through 18 (::part-iii-child-s-tax::b01, ::b03, the blank form). */
function partIII(line4: number, line5: number, line13: number, status: FilingStatus): PartIII {
  const line14 = line4 - line5;
  // "If the amounts on line 4 and line 5 above are the same, enter -0- on line 15."
  const line15 = californiaTaxOn(line14, status);
  const line16 = line13 + line15;
  const line17 = californiaTaxOn(line4, status);
  return { line14, line15, line16, line17, line18: line18(line16, line17) };
}

/*
 * The form's lines; undefined while the form does not file or an input is
 * blank; unsupported with a gap for the whole form.
 */
export function form3800CaLines(
  form: Accessor,
  info: Form3800CaFilingInfo,
): Form3800CaLines | Unsupported | undefined {
  if (info.mustFile?.["form-3800-ca"]?.value !== true) return undefined;
  if (info.form3800CaGap) return unsupported(info.form3800CaGap);
  const answers = info.form3800CaAnswers;
  const child = childReturn(form);
  const status = info.filingStatus;
  if (answers === undefined || child === undefined || status === undefined) return undefined;
  const itemized = itemizes(child.deductions, status);
  if (itemized && answers.itemizedForUnearnedIncome === undefined) {
    return unsupported(ITEMIZED_WITHOUT_AMOUNT);
  }
  const first = line1(child.californiaAgi, child.earnedIncome);
  const second = line2(itemized, answers.itemizedForUnearnedIncome ?? 0);
  const line3 = first - second;
  const partI = { line1: first, line2: second, line3 };
  if (line3 <= 0) return partI;
  const line4 = child.taxableIncome;
  const line5 = Math.min(line3, line4);
  if (line5 <= 0) return { ...partI, line4, line5 };
  const tentative = partII(line5, answers);
  return {
    ...partI,
    line4,
    line5,
    partII: tentative,
    partIII: partIII(line4, line5, tentative.line13, status),
  };
}

/*
 * Form 540 line 31's tax: FTB 3800 line 18 when the form figures the tax
 * (::part-iii-child-s-tax::b03), else the regular tax ("regular": the form does
 * not file, or line 3 or 5 stops it; "figure the tax in the normal manner",
 * ::purpose::b01). Undefined while the form waits; unsupported with the gap.
 */
export function childTaxOnLine31(
  form: Accessor,
  info: Form3800CaFilingInfo,
): "regular" | number | Unsupported | undefined {
  if (info.mustFile?.["form-3800-ca"]?.value !== true) return "regular";
  const lines = form3800CaLines(form, info);
  if (lines === undefined || "unsupported" in lines) return lines;
  return lines.partIII === undefined ? "regular" : lines.partIII.line18;
}
