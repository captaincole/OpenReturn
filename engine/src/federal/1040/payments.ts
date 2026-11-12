import type { FormAccessor } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { schedule8812Line18aGap } from "../schedule-8812/earnedIncomeGap.js";
import { eicOutcome } from "../schedule-eic/outcome.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import type { Form1040 } from "./types.js";

/*
 * MANUAL EDIT: Schedule 8812 Part II (irs-1040s8-inst-2025::sec::part-ii-a-additional-child-tax-credit::b01)
 * applies "If the amount on line 12 is more than line 14", and line 16b says
 * "If zero, stop here". A closed part leaves line 27 blank for good. Line 14
 * waits on Form 1040 line 18, so a blank line 14 may still open the part. A
 * blank line 12 opens it only while a dependent's credit is undecided: a filed
 * schedule left out of a test run reads blank, as line 19 reads a blank line 14.
 */
function partIIMayOpen(form: FormAccessor<Form1040>, info: Form1040FilingInfo): boolean {
  const line12 = form["schedule-8812.0.line.12_credit_after_phaseout"];
  const line14 = form["schedule-8812.0.line.14_child_tax_credit_and_other_dependents"];
  const line16b = form["schedule-8812.1.line.16b_qualifying_children_times_1700"];
  if (typeof line12 !== "number") {
    return info.dependents?.some((row) => row.credit === undefined) === true;
  }
  if (typeof line14 !== "number") return true;
  return line12 > line14 && line16b !== 0;
}

/*
 * MANUAL EDIT: line 32 adds lines 27a and 28 only once both are final: a blank
 * line counts as 0 only when the credit is none. true when both are final;
 * undefined while one waits; the EIC's gap when line 27a is unsupported, and
 * Schedule 8812 line 18a's gap when line 28 is blank for it.
 */
export function refundableCreditsFinal(
  form: FormAccessor<Form1040>,
  info: Form1040FilingInfo,
): true | Unsupported | undefined {
  const eic = eicOutcome(form, info);
  if (eic.kind === "unsupported") return unsupported(eic.reason);
  if (eic.kind === "waiting") return undefined;
  if (eic.kind === "credit" && typeof form["line.27a"] !== "number") return undefined;
  if (typeof form["line.28"] === "number") return true;
  const line18aGap = schedule8812Line18aGap(form, info);
  if (line18aGap !== undefined) return unsupported(line18aGap);
  return partIIMayOpen(form, info) ? undefined : true;
}
