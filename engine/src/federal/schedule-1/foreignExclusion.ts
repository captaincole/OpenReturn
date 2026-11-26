/*
 * MANUAL EDIT: Schedule 1 lines 8d and 24j from Form 2555. Line 8d: "Enter the
 * amount of your foreign earned income and housing exclusion from Form 2555,
 * line 45" (irs-1040-inst-2025::sec::line-8d::b01), every person's form. Line
 * 24j: "Enter the housing deduction from Form 2555"
 * (irs-1040-inst-2025::sec::line-24j::b01), line 50. Without Form 2555 each
 * line keeps the reason it had before the form had rules.
 */

import type { FormAccessor } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { exclusionTotal, files2555, form2555Hold, housingDeductionTotal } from "../2555/results.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import type { Schedule1 } from "./types.js";

type Form = FormAccessor<Schedule1>;

const NO_FORM_2555_LINE_8D = "No Form 2555 foreign earned income exclusion scenario yet";
const NO_FORM_2555_LINE_24J =
  "Form 2555 (foreign housing deduction) not ingested; no foreign-income scenario yet.";

export const line8d = (form: Form, info: Schedule1FilingInfo) =>
  files2555(info) ? exclusionTotal(form, info) : unsupported(NO_FORM_2555_LINE_8D);

export const line24j = (_: Form, info: Schedule1FilingInfo) =>
  files2555(info) ? housingDeductionTotal(info) : unsupported(NO_FORM_2555_LINE_24J);

/*
 * Lines 9, 10 and 25 add lines 8d and 24j. They wait while Form 2555 waits
 * and are a gap with its gap, so a total never prints without them.
 */
export function foreignExclusionHold(
  form: Form,
  info: Schedule1FilingInfo,
): Unsupported | "waiting" | undefined {
  return form2555Hold(form, info);
}
