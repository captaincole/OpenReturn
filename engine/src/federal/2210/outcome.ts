/*
 * Form 2210 for one return: the answers (filing info) and the return's amounts
 * go into the pure form (form.ts). Form 2210's bindings and Form 1040 lines
 * 35a, 37 and 38 read the outcome.
 */

import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { standardDeduction } from "../1040/deductions.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import type { Form2210Answers, Form2210FilingInfo } from "./filingInfo.js";
import { form2210, type Form2210Inputs, type Form2210Result } from "./form.js";
import { partILines, type PartIInputs, type PartILines } from "./partI.js";
import {
  partIGap,
  partIReturnAmounts,
  scheduleAIGap,
  SELF_EMPLOYMENT_TAX,
  yearColumnAmounts,
  type PartIReturnAmounts,
  type ReturnAccessor,
} from "./returnAmounts.js";
import type { AnnualizedColumnInputs, ScheduleAIInputs } from "./scheduleAI.js";
import { netEarningsFromProfit } from "./scheduleAIPartII.js";

export type Form2210Info = Form2210FilingInfo & Form1040FilingInfo;

export type Form2210Outcome =
  | { kind: "not_filed" }
  | { kind: "waiting" }
  | { kind: "gap"; reason: string; partI?: PartILines }
  | { kind: "figured"; result: Form2210Result };

const filesForm2210 = (info: Form2210Info) => info.mustFile?.["form-2210"]?.value === true;

/*
 * Household employment taxes count on line 2 unless "(1) you didn't have
 * federal income tax withheld from your income, and (2) you wouldn't be
 * required to make estimated tax payments even if the household employment
 * taxes weren't included" (irs-2210-inst-2025::sec::line-2::b01). The engine
 * reads (2) as: Part I without them shows no possible penalty.
 */
function partIInputs(amounts: PartIReturnAmounts, answers: Form2210Answers, mfs: boolean) {
  const base: PartIInputs = {
    taxAfterCredits: amounts.taxAfterCredits,
    otherTaxes: amounts.otherTaxesWithoutHousehold,
    refundableCredits: amounts.refundableCredits,
    withholding: amounts.withholding,
    priorYearTax: answers.priorYearTax,
    priorYearAgi: answers.priorYearAgi,
    marriedFilingSeparately: mfs,
  };
  const required = partILines(base).line9MoreThanLine6 === true;
  const household = amounts.incomeTaxWithheld > 0 || required;
  return household
    ? { ...base, otherTaxes: base.otherTaxes + amounts.householdEmploymentTaxes }
    : base;
}

/* Schedule AI columns (a)–(c) from the stated periods and (d) from the return. */
function scheduleAIInputs(
  form: ReturnAccessor,
  info: Form2210Info,
  answers: Form2210Answers,
  partIExtras: { line2: number; line3: number },
): Omit<ScheduleAIInputs, "requiredAnnualPayment"> | undefined {
  const year = yearColumnAmounts(form, info);
  const itemizes = info.useItemizedDeductions === true;
  const standard = itemizes ? standardDeduction(info) : form["form-1040.line.12e"];
  if (!year || typeof standard !== "number" || !info.filingStatus) return undefined;
  const periods: AnnualizedColumnInputs[] = (answers.annualizedPeriods ?? []).map((period) => ({
    adjustedGrossIncome: period.adjustedGrossIncome,
    itemizedDeductions: period.itemizedDeductions ?? 0,
    standardDeduction: standard,
    qbiDeduction: period.qbiDeduction ?? 0,
    qualifiedDividends: period.qualifiedDividends ?? 0,
    netCapitalGain: period.netCapitalGain ?? 0,
    otherTaxes: period.otherTaxes ?? 0,
    credits: period.credits ?? 0,
    selfEmployment: {
      netEarnings: netEarningsFromProfit(period.selfEmploymentProfit ?? 0),
      socialSecurityWages: period.socialSecurityWages ?? 0,
    },
  }));
  const yearColumn: AnnualizedColumnInputs = {
    ...year,
    standardDeduction: standard,
    /* Line 16 (line-16::b01): Part I line 2 except SE tax, plus AMT, Form 4972 and Form 8814 tax. */
    otherTaxes: partIExtras.line2 - sum(form[SELF_EMPLOYMENT_TAX]) + year.taxesBeyondLine2,
    /* Line 18 (line-18::b01): the credits of Part I lines 1 and 3. */
    credits: year.nonrefundableCredits + partIExtras.line3,
    selfEmployment: {
      netEarnings: year.selfEmploymentNetEarnings,
      socialSecurityWages: year.socialSecurityWages,
    },
  };
  return { columns: [...periods, yearColumn], itemizes, filingStatus: info.filingStatus };
}

/*
 * Box D treats "the federal income tax withheld" as paid when withheld
 * (table-1-estimated-tax-payments::b02): the dated amounts must be all of line 6.
 */
function datedWithholdingGap(answers: Form2210Answers, lines: PartILines): string | undefined {
  if (!answers.datedWithholding || lines.line6 === undefined) return undefined;
  const dated = sum(...answers.datedWithholding.map((payment) => payment.amount));
  return dated === lines.line6
    ? undefined
    : `The withholding stated by date adds up to ${dated}, not line 6 (${lines.line6}), so box D cannot be figured.`;
}

/*
 * The pure form's inputs, or why they are not ready.
 *
 * DECISION (2026-11-24): two official texts differ for a person who had no
 * tax for 2024 and did not file.
 * - "You won't have to pay the penalty ... if ... You had no tax liability for
 *   2024 ... and your 2024 tax return was (or would have been had you been
 *   required to file) for a full 12 months"
 *   (irs-2210-inst-2025::sec::exceptions-to-the-penalty::b01).
 * - "If you didn't file a return for 2024 ... don't complete line 8. Instead,
 *   enter the amount from line 5 on line 9" (irs-2210-inst-2025::sec::line-19::b03).
 * The engine applies the exception through line 8 only: a stated 2024 tax of 0
 * gives no penalty, and "no 12-month return" figures one. So a person with no
 * 2024 tax must be recorded with a 2024 tax of 0, and Cade asks for it.
 */
function formInputs(
  form: ReturnAccessor,
  info: Form2210Info,
  answers: Form2210Answers,
): Form2210Inputs | "waiting" | Unsupported {
  const amounts = partIReturnAmounts(form);
  const waits =
    answers.jointReturn2024 === undefined ||
    (!answers.noTwelveMonthReturn &&
      (answers.priorYearTax === undefined || answers.priorYearAgi === undefined)) ||
    (answers.waiver?.request === "part" && answers.waiver.amount === undefined) ||
    answers.annualizedPeriodsIncomplete;
  if (!amounts || waits || !info.filingStatus) return "waiting";
  const partI = partIInputs(amounts, answers, info.filingStatus === "married_filing_separately");
  const lines = partILines(partI);
  const withholdingGap = datedWithholdingGap(answers, lines);
  if (withholdingGap) return unsupported(withholdingGap);
  let annualized: Form2210Inputs["annualized"];
  if (answers.annualizedPeriods) {
    const gap = scheduleAIGap(form, info);
    if (gap) return unsupported(gap);
    annualized = scheduleAIInputs(form, info, answers, { line2: lines.line2, line3: lines.line3 });
    if (!annualized) return "waiting";
  }
  return {
    partI,
    jointReturn2025: info.filingStatus === "married_filing_jointly",
    jointReturn2024: answers.jointReturn2024 as boolean,
    waiver: answers.waiver && {
      request: answers.waiver.request,
      amount: answers.waiver.amount ?? 0,
    },
    estimatedPayments: answers.estimatedPayments,
    datedWithholding: answers.datedWithholding,
    annualized,
  };
}

export function form2210Outcome(form: ReturnAccessor, info: Form2210Info): Form2210Outcome {
  if (!filesForm2210(info)) return { kind: "not_filed" };
  if (info.form2210Gap) return { kind: "gap", reason: info.form2210Gap };
  const gap = partIGap(form, info);
  if (gap) return { kind: "gap", reason: gap };
  if (!info.form2210) return { kind: "waiting" };
  const inputs = formInputs(form, info, info.form2210);
  if (inputs === "waiting") return { kind: "waiting" };
  if ("unsupported" in inputs) {
    const amounts = partIReturnAmounts(form);
    const mfs = info.filingStatus === "married_filing_separately";
    const partI = amounts && partILines(partIInputs(amounts, info.form2210, mfs));
    return { kind: "gap", reason: inputs.reason, partI };
  }
  return { kind: "figured", result: form2210(inputs) };
}
