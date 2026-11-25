/*
 * Schedule 3 line 2 (Form 2441 line 11) for a total that subtracts it, such as
 * Form 8801 line 22. A gap or a missing answer above line 11 leaves it blank,
 * and the total would read the blank as 0. Line 11 is blank with no credit only
 * when the form claims none, or when line 10, the tax limit, is blank: no tax
 * to take it, or Part III line 29 leaves no expenses for Part II (the gate in
 * bindings.ts). Read by full field id, so any form's accessor works.
 */

import { numberOrBlank } from "../../money.js";
import type { Form2441FilingInfo } from "./filingInfo.js";
import { claimsCredit, hasBenefits } from "./lines.js";

type Accessor = { readonly [fieldId: string]: unknown };

const LINE_10 = "form-2441.0.line.10_tax_liability_limit";
const LINE_11 = "form-2441.0.line.11_dependent_care_credit";
const LINE_29 = "form-2441.1.line.29_line_27_minus_28";

const LINE_11_BLANK = "Schedule 3 line 2 (Form 2441 line 11, the credit) is blank";

/* Why Form 2441 line 11 is blank although the form claims a credit; undefined when it is not. */
export function dependentCareCreditGap(
  form: Accessor,
  info: Form2441FilingInfo,
): string | undefined {
  if (info.mustFile?.["form-2441"]?.value !== true || claimsCredit(info) !== true) return undefined;
  if (numberOrBlank(form[LINE_11]) !== undefined) return undefined;
  if ((info.dependentCareProviders ?? []).length === 0) {
    return `${LINE_11_BLANK}: no care provider is recorded for line 1.`;
  }
  if (hasBenefits(info) && numberOrBlank(form[LINE_29]) === undefined) {
    return `${LINE_11_BLANK}: Part III line 29 is an engine gap or waits for an answer.`;
  }
  if (numberOrBlank(form[LINE_10]) === undefined) return undefined;
  return `${LINE_11_BLANK}: a line from 3 to 9c is an engine gap or waits for an answer.`;
}
