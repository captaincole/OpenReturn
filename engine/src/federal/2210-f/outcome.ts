/*
 * Form 2210-F for one return: the answers (filing info) and the return's
 * amounts go into the pure form (lines.ts). The bindings and Form 1040 line 38
 * (2210/receivers.ts) read the outcome.
 */

import { partIGap, partIReturnAmounts, type ReturnAccessor } from "../2210/returnAmounts.js";
import type { Form2210FAnswers, Form2210FFilingInfo } from "./filingInfo.js";
import { form2210FLines, type Form2210FInputs, type Form2210FLines } from "./lines.js";

export type Form2210FOutcome =
  | { kind: "not_filed" }
  | { kind: "waiting" }
  | { kind: "gap"; reason: string }
  | { kind: "figured"; lines: Form2210FLines };

/* True while an answer the form needs is missing. */
function waits(answers: Form2210FAnswers): boolean {
  return (
    answers.jointReturn2024 === undefined ||
    answers.filedAndPaidByMarch2 === undefined ||
    (!answers.noTwelveMonthReturn && answers.priorYearTax === undefined) ||
    (answers.waiver?.request === "part" && answers.waiver.amount === undefined)
  );
}

/* The pure form's inputs, or undefined while the return or an answer waits. */
function formInputs(
  form: ReturnAccessor,
  info: Form2210FFilingInfo,
  answers: Form2210FAnswers,
): Form2210FInputs | undefined {
  const amounts = partIReturnAmounts(form);
  if (!amounts || !info.filingStatus || waits(answers)) return undefined;
  return {
    taxAfterCredits: amounts.taxAfterCredits,
    otherTaxes: amounts.otherTaxesWithoutHousehold,
    householdEmploymentTaxes: amounts.householdEmploymentTaxes,
    incomeTaxWithheld: amounts.incomeTaxWithheld,
    refundableCredits: amounts.refundableCredits,
    section1062NetTaxLiability: answers.section1062NetTaxLiability,
    withholding: amounts.withholding,
    priorYearTax: answers.priorYearTax,
    paymentsByDueDate: answers.paymentsByDueDate,
    latePayments: answers.latePayments,
    underpaymentPaidOn: answers.underpaymentPaidOn,
    filedAndPaidByMarch2: answers.filedAndPaidByMarch2 === true,
    jointReturn2024: answers.jointReturn2024 === true,
    jointReturn2025: info.filingStatus === "married_filing_jointly",
    waiver: answers.waiver && {
      request: answers.waiver.request,
      amount: answers.waiver.amount ?? 0,
    },
  };
}

export function form2210FOutcome(
  form: ReturnAccessor,
  info: Form2210FFilingInfo,
): Form2210FOutcome {
  if (info.mustFile?.["form-2210-f"]?.value !== true) return { kind: "not_filed" };
  if (info.form2210FGap) return { kind: "gap", reason: info.form2210FGap };
  const gap = partIGap(form);
  if (gap) return { kind: "gap", reason: gap };
  if (!info.form2210F) return { kind: "waiting" };
  const inputs = formInputs(form, info, info.form2210F);
  return inputs ? { kind: "figured", lines: form2210FLines(inputs) } : { kind: "waiting" };
}
