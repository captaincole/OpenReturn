/*
 * The lines of other forms that change when Form 4563 excludes income: the
 * standard deduction is shared (Form 1040 line 12e), and the deductions and
 * taxes the engine cannot share or figure are named gaps. Every function reads
 * other forms' fields by their full id.
 */

import { numberOrBlank, sum } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { files2555 } from "../2555/results.js";
import type { Form8959FilingInfo } from "../8959/filingInfo.js";
import { ADDITIONAL_MEDICARE_THRESHOLDS } from "../8959/lines.js";
import { resolve8959Info } from "../8959/resolveInfo.js";
import type { ScheduleSEFilingInfo } from "../schedule-se/filingInfo.js";
import { resolveScheduleSEInfo, selfEmploymentIncome } from "../schedule-se/resolveInfo.js";
import type { Form4563FilingInfo } from "./filingInfo.js";
import { allowableShare, excludedSelfEmployment, owesSelfEmploymentTax } from "./lines.js";
import { resolve4563Info } from "./resolveInfo.js";
import { excludedGrossIncomeTotal, excludesIncome, files4563 } from "./results.js";

/* Any form's accessor: full field ids ("form-1040.line.1z") resolve from every form. */
export type ReturnAccessor = { readonly [fieldId: string]: unknown };
type Result = number | Unsupported | undefined;
type Info = Form4563FilingInfo & ScheduleSEFilingInfo & Form8959FilingInfo;

const GROSS_INCOME_GAP =
  "Form 4563 excludes income, so the standard deduction is shared by gross income (Pub. 570, chapter 4, Standard Deduction), and this return has income whose gross income the engine does not figure: a business, rental, farm or Form 4797 amount, a Schedule D, a net operating loss, or Form 2555.";
const ITEMIZED_GAP =
  "Form 4563 excludes income: each itemized deduction that is not definitely related to one kind of income is shared by gross income, and only that share goes on Schedule A (irs-4563-form-2025::sec::filing-form-1040-or-1040-sr::b01; Pub. 570, chapter 4, Itemized Deductions); the engine does not share Schedule A lines.";
const INCREASED_STANDARD_GAP =
  "Form 4563 excludes income, and the standard deduction is increased by a net qualified disaster loss on Schedule A line 16; the engine does not share that amount.";
const ALIMONY_GAP =
  "Form 4563 excludes income: alimony paid is shared by gross income (Pub. 570, chapter 4, Deductions if Territory Income Is Excluded), and the engine does not share it.";
const SELF_EMPLOYMENT_GAP =
  "Form 4563 excludes self-employment income (line 10 or 13): self-employment tax is still owed on it (irs-4563-form-2025::sec::filing-form-1040-or-1040-sr::b02), and the engine does not carry excluded income to Schedule SE.";
const SELF_EMPLOYMENT_DEDUCTION_GAP =
  "Form 4563 excludes self-employment income next to a Schedule SE: only the part of the deduction based on the income that is not excluded is allowed (Pub. 570, chapter 4, Self-employment tax deduction), and the engine does not figure Schedule SE with the excluded income.";
const ADDITIONAL_MEDICARE_GAP =
  "Form 4563 excludes wages from Form W-2AS, whose Medicare wages count on Form 8959 (irs-8959-inst-2025::sec::future-developments::b01), and with them the Medicare wages and self-employment income pass the threshold; the engine does not add excluded wages to Form 8959.";

/* Schedule 1 lines whose gross income differs from the amount: business, Form 4797, rental, farm, NOL. */
const NET_LINES = [
  "schedule-1.0.line.3",
  "schedule-1.0.line.4",
  "schedule-1.0.line.5",
  "schedule-1.0.line.6",
  "schedule-1.0.line.8a",
];
/* Form 1040 income lines that are gross income as they print (Pub. 570, Table 4-1, note **). */
const GROSS_LINES = [
  "form-1040.line.1z",
  "form-1040.line.2b",
  "form-1040.line.3b",
  "form-1040.line.4b",
  "form-1040.line.5b",
  "form-1040.line.6b",
  "form-1040.line.7a",
  "form-1040.line.8",
];

/*
 * Gross income subject to U.S. income tax: Form 1040 lines 1z to 8 when each
 * is gross income as it prints. Not with a Schedule D ("Gross income includes
 * gains, but not losses"), a business, rental or farm amount ("Gross income
 * from a business means ... Schedule C, line 7"), a negative line or Form 2555.
 */
export function usGrossIncome(form: ReturnAccessor, info: Form4563FilingInfo): Result {
  const netLine = NET_LINES.some((id) => (numberOrBlank(form[id]) ?? 0) !== 0);
  if (files2555(info) || info.mustFile?.["schedule-d"]?.value === true || netLine) {
    return unsupported(GROSS_INCOME_GAP);
  }
  const lines = GROSS_LINES.map((id) => numberOrBlank(form[id]));
  if (lines.some((line) => line !== undefined && line < 0)) return unsupported(GROSS_INCOME_GAP);
  return sum(...lines);
}

/* Form 1040 line 12e, the standard deduction: the full amount, or its share with Form 4563. */
export function standardDeductionShare(
  form: ReturnAccessor,
  info: Form4563FilingInfo,
  full: number | undefined,
): Result {
  if (full === undefined || !excludesIncome(info)) return full;
  const usGross = usGrossIncome(form, info);
  if (typeof usGross !== "number") return usGross;
  return allowableShare(full, usGross, excludedGrossIncomeTotal(info));
}

/* Form 1040 line 12e with itemized deductions or the increased standard deduction. */
export function deductionGap(info: Form4563FilingInfo, itemized: boolean): Unsupported | undefined {
  if (!excludesIncome(info)) return undefined;
  return unsupported(itemized ? ITEMIZED_GAP : INCREASED_STANDARD_GAP);
}

/* Schedule A line 17. */
export const scheduleAGap = (info: Form4563FilingInfo): Unsupported | undefined =>
  excludesIncome(info) ? unsupported(ITEMIZED_GAP) : undefined;

/* Schedule 1 line 19a, alimony paid. */
export const alimonyGap = (info: Form4563FilingInfo): Unsupported | undefined =>
  excludesIncome(info) ? unsupported(ALIMONY_GAP) : undefined;

const filers = (info: Form4563FilingInfo) => (files4563(info) ? (info.form4563Filers ?? []) : []);

/*
 * Schedule 2 line 4: a gap when a person owes self-employment tax on excluded
 * income, or when excluded self-employment income meets the taxpayer's
 * Schedule SE. With neither, the excluded income adds no tax.
 */
export function selfEmploymentTaxGap(info: Info): Unsupported | undefined {
  const scheduleSE = info.mustFile?.["schedule-se"]?.value === true;
  const gap = filers(info).some((filer) => {
    const excluded = excludedSelfEmployment(filer.lines);
    if (excluded === 0) return false;
    return owesSelfEmploymentTax(excluded) || (filer.owner === "taxpayer" && scheduleSE);
  });
  return gap ? unsupported(SELF_EMPLOYMENT_GAP) : undefined;
}

/* Schedule 1 line 15: a gap when the taxpayer's excluded self-employment income meets a Schedule SE. */
export function selfEmploymentDeductionGap(info: Info): Unsupported | undefined {
  if (info.mustFile?.["schedule-se"]?.value !== true) return undefined;
  const taxpayer = filers(info).find((filer) => filer.owner === "taxpayer");
  if (taxpayer === undefined || excludedSelfEmployment(taxpayer.lines) === 0) return undefined;
  return unsupported(SELF_EMPLOYMENT_DEDUCTION_GAP);
}

/*
 * Schedule 2 line 21 and Form 1040 lines 23 and 24: the first gap of lines 4
 * and 11, so the total tax is a gap too and never leaves out a tax.
 */
export const otherTaxesGap = (info: Info): Unsupported | undefined =>
  selfEmploymentTaxGap(info) ?? additionalMedicareGap(info);

/*
 * Schedule 2's must-file: it files when line 4 or line 11 is one of these
 * gaps, so the gap shows and Form 1040 line 23 does not read a blank as no tax.
 */
export function form4563ReachesSchedule2(inputs: ResolverInputs): boolean {
  const form4563 = resolve4563Info(inputs);
  const form8959 = resolve8959Info(inputs);
  const scheduleSE = resolveScheduleSEInfo(inputs);
  const info: Info = {
    ...form8959,
    ...scheduleSE,
    form4563Filers: form4563.form4563Filers,
    mustFile: { ...form8959.mustFile, ...scheduleSE.mustFile, ...form4563.mustFile },
    filingStatus: filingStatusOf(inputs),
  };
  return otherTaxesGap(info) !== undefined;
}

/*
 * Schedule 2's line 11 feeder: Form 8959's must-file, or true with a Form 4563
 * gap on line 4 or 11 (form4563ReachesSchedule2). The registry takes them as one.
 */
export function form8959OrForm4563ReachesSchedule2(inputs: ResolverInputs): boolean | undefined {
  const filed = resolve8959Info(inputs).mustFile?.["form-8959"]?.value;
  return filed === true || form4563ReachesSchedule2(inputs) ? true : filed;
}

/*
 * Schedule 2 line 11: a gap when the excluded Medicare wages (Form W-2AS box
 * 5), the return's W-2 Medicare wages and the self-employment income pass the
 * Form 8959 threshold of the filing status.
 */
export function additionalMedicareGap(info: Info): Unsupported | undefined {
  const excluded = sum(...filers(info).map((filer) => filer.answers.wages?.medicareWages));
  if (excluded <= 0 || info.filingStatus === undefined) return undefined;
  const threshold = ADDITIONAL_MEDICARE_THRESHOLDS[info.filingStatus];
  const total = sum(excluded, info.w2MedicareWagesTotal, selfEmploymentIncome(info));
  return total > threshold ? unsupported(ADDITIONAL_MEDICARE_GAP) : undefined;
}
