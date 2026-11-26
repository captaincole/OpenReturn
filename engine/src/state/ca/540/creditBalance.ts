/*
 * The Form 540 tax that is left for a credit after the credits Schedule P
 * (540) Part III applies before it, for a return with no Schedule P: line 35
 * less line 40 (Section A1), the credit for prior year AMT (Section A2 line
 * 10) and the renter's credit (line 46, Section B1)
 * (ca-540-sched-p-inst-2025::sec::credit-table::b01, ::to-complete-part-iii::b01).
 * FTB 3801-CR's credits (Section B2) and FTB 3804-CR's (Section B4) read it.
 * `read` takes a full field id; undefined while a credit it reads waits.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { atLeast, numberOrBlank, sum } from "../../../money.js";
import { files3510, priorYearAmtCreditUsed, priorYearAmtCreditWaits } from "../3510/creditUsed.js";

type ReadField = (fieldId: string) => unknown;

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/* Form 540 line 40, the child and dependent care credit; undefined while it waits. */
export function childCareCreditTaken(read: ReadField, info: BaseFilingInfo): number | undefined {
  if (!files(info, "form-3506")) return 0;
  const credit = numberOrBlank(read("form-3506.0.line.12_child_dependent_care_credit"));
  if (credit === undefined) return undefined;
  if (credit <= 0) return 0;
  return numberOrBlank(read("form-540.line.40_child_dependent_care_credit"));
}

/* The credits of Sections A1, A2 and B1 that the engine figures; undefined while one waits. */
export function creditsBeforeSectionB2(
  read: ReadField,
  info: BaseFilingInfo,
): number[] | undefined {
  const childCare = childCareCreditTaken(read, info);
  if (childCare === undefined || priorYearAmtCreditWaits(read, info)) return undefined;
  const priorYearAmt = files3510(info) ? (priorYearAmtCreditUsed(read) ?? 0) : 0;
  const renters = numberOrBlank(read("form-540.line.46_renters_credit")) ?? 0;
  return [childCare, priorYearAmt, renters];
}

/* Line 35 less the credits before Section B2, not less than 0. */
export function taxBeforeSectionB2(read: ReadField, info: BaseFilingInfo): number | undefined {
  const tax = numberOrBlank(read("form-540.line.35_total_tax_after_credits"));
  const before = creditsBeforeSectionB2(read, info);
  if (tax === undefined || before === undefined) return undefined;
  return atLeast(0, tax - sum(...before));
}
