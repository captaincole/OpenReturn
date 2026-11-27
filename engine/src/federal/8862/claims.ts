/*
 * Line 2: "Check the box(es) that applies to the credit(s) you are now
 * claiming. You can check a box for each credit that was previously reduced
 * or disallowed" (irs-8862-inst-2025::sec::line-2::b01). A box is true when a
 * denial of that credit is stated and the return claims it, false when the
 * return does not claim it, and blank while the credit still waits. The
 * engine takes the form off the return when no box ends up checked
 * (filesOnlyWithAmountOn).
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { refundableCreditGap } from "../8863/credit.js";
import { eicOutcome } from "../schedule-eic/outcome.js";
import type { Form8862FilingInfo } from "./filingInfo.js";

type Lines = FormAccessor<object>;
type Box = boolean | Unsupported | undefined;

const files = (info: Form8862FilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;
const above0 = (value: number | undefined) => value !== undefined && value > 0;

/* The EIC box: Form 1040 line 27a's outcome, a gap staying a gap. */
export function eicBox(form: Lines, info: Form8862FilingInfo): Box {
  if (info.form8862?.eic.needed !== true) return false;
  const outcome = eicOutcome(form, info);
  if (outcome.kind === "unsupported") return unsupported(outcome.reason);
  if (outcome.kind === "waiting") return undefined;
  return outcome.kind === "credit";
}

const LINE_12 = "schedule-8812.0.line.12_credit_after_phaseout";
const LINE_14 = "schedule-8812.0.line.14_child_tax_credit_and_other_dependents";
const LINE_16B = "schedule-8812.1.line.16b_qualifying_children_times_1700";
const LINE_27 = "schedule-8812.1.line.27_additional_child_tax_credit";

/*
 * The CTC/ACTC/ODC box: Schedule 8812 line 14 (Form 1040 line 19) or line 27
 * (line 28) above 0. Part II-A applies only "If the amount on line 12 is more
 * than line 14", and line 16b of 0 stops it, so with line 14 at 0 a closed
 * Part II leaves the box unchecked (irs-1040s8-inst-2025::sec::part-ii-a-additional-child-tax-credit::b01).
 */
export function ctcBox(form: Lines, info: Form8862FilingInfo): Box {
  if (info.form8862?.ctcNeeded !== true || !files(info, "schedule-8812")) return false;
  const line14 = numberOrBlank(form[LINE_14]);
  const line27 = numberOrBlank(form[LINE_27]);
  if (above0(line14) || above0(line27)) return true;
  if (line14 === undefined) return undefined;
  if (line27 !== undefined) return false;
  const line12 = numberOrBlank(form[LINE_12]);
  if (line12 !== undefined && line12 <= line14) return false;
  return numberOrBlank(form[LINE_16B]) === 0 ? false : undefined;
}

const LINE_7 = "form-8863.0.line.7_tentative_american_opportunity_credit";

/* The AOTC box: Form 8863 line 7, the credit after the phase-out, above 0; a gap in Part I stays a gap. */
export function aotcBox(form: Lines, info: Form8862FilingInfo): Box {
  if (info.form8862?.aotcNeeded !== true || !files(info, "form-8863")) return false;
  if (info.form8863?.americanOpportunity === false) return false;
  const line7 = numberOrBlank(form[LINE_7]);
  if (line7 !== undefined) return line7 > 0;
  return refundableCreditGap(form, info);
}
