import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { line30From8839 } from "../8839/receivers.js";
import { LINE_8_ID, refundableCreditGap } from "../8863/credit.js";
import { schedule8812Line18aGap } from "../schedule-8812/earnedIncomeGap.js";
import { eicOutcome } from "../schedule-eic/outcome.js";
import type { Form1040FilingInfo } from "./filingInfo.js";
import type { Form1040 } from "./types.js";
import { WITHOUT_8839 } from "./withoutForm8839.js";

type Form = FormAccessor<Form1040>;

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

export const line25a = (_: unknown, info: Form1040FilingInfo) =>
  roundDollars(info.w2FederalWithholding);

// MANUAL EDIT: 1099 box 4 and SSA-1099 box 6; blank when nothing was withheld.
export const line25b = (_: unknown, info: Form1040FilingInfo) =>
  roundDollars(info.form1099FederalWithholding);

/*
 * MANUAL EDIT: line 25c = W-2G box 4 (rounded sum) + Form 8959 line 24; blank
 * when neither has an amount (irs-1040-inst-2025::sec::line-25c-other-forms::b01).
 * Schedule K-1, 1042-S, 8805 and 8288-A withholding is not modeled: no facts.
 */
export function line25c(form: Form, info: Form1040FilingInfo) {
  const medicare = form["form-8959.0.line.24_total_additional_medicare_tax_withholding"];
  const w2g = roundDollars(info.w2gFederalWithholding);
  return typeof medicare !== "number" && w2g === undefined ? undefined : sum(medicare, w2g);
}

export const line25d = (form: Form) => sum(form["line.25a"], form["line.25b"], form["line.25c"]);

// MANUAL EDIT: line 27a's steps (schedule-eic/outcome.ts); blank when there is no credit.
export function line27a(form: Form, info: Form1040FilingInfo) {
  const outcome = eicOutcome(form, info);
  if (outcome.kind === "unsupported") return unsupported(outcome.reason);
  return outcome.kind === "credit" ? outcome.amount : undefined;
}

// MANUAL EDIT: checked where the line 27a steps say to; the opt-out has no fact.
export function line27cNoEicClaim(form: Form, info: Form1040FilingInfo) {
  const outcome = eicOutcome(form, info);
  if (outcome.kind === "unsupported") return unsupported(outcome.reason);
  return outcome.kind === "none" && outcome.checkLine27c ? true : undefined;
}

// MANUAL EDIT: line 28 = Schedule 8812 line 27; blank when Schedule 8812 is not filed.
export const line28 = (form: Form) =>
  numberOrBlank(form["schedule-8812.1.line.27_additional_child_tax_credit"]);

/*
 * MANUAL EDIT: line 29 = Form 8863 line 8, the refundable American opportunity
 * credit (irs-1040-inst-2025::sec::line-29::b01). Blank when the form does not
 * file or line 8 is blank; a gap in Form 8863 stays a gap here.
 */
export const line29 = (form: Form, info: Form1040FilingInfo) =>
  numberOrBlank(form[LINE_8_ID]) ?? refundableCreditGap(form, info);

// MANUAL EDIT: line 30 = Form 8839 line 13, the refundable adoption credit.
export function line30(form: Form, info: Form1040FilingInfo) {
  const received = line30From8839(form, info);
  return received === undefined ? unsupported(WITHOUT_8839.line30) : received.value;
}

/*
 * MANUAL EDIT: line 31 is not modeled (line 29 reads Form 8863, line 30 Form 8839); blank when every line is blank.
 * Waits while line 27a or 28 can still change (payments.ts).
 */
export function line32(form: Form, info: Form1040FilingInfo) {
  const final = refundableCreditsFinal(form, info);
  if (final !== true) return final;
  return sumOrBlank(
    form["line.27a"],
    form["line.28"],
    form["line.29"],
    form["line.30"],
    form["line.31"],
  );
}

// MANUAL EDIT: a blank line 32 counts as 0 only when it is final.
export const line33 = (form: Form, info: Form1040FilingInfo) =>
  refundableCreditsFinal(form, info) === true
    ? sum(form["line.25d"], form["line.26"], form["line.32"])
    : undefined;

// MANUAL EDIT: line 34 (overpaid) only when line 33 exceeds line 24; blank otherwise.
export function line34(form: Form) {
  const paid = form["line.33"];
  const tax = form["line.24"];
  if (typeof paid !== "number" || typeof tax !== "number") return undefined;
  return paid > tax ? paid - tax : undefined;
}

// MANUAL EDIT: line 35a = line 34 only when the full overpayment is refunded.
export const line35a = (form: Form, info: Form1040FilingInfo) =>
  info.refundFullOverpaymentFederal ? form["line.34"] : undefined;

// MANUAL EDIT: line 37 includes the line 38 penalty (not modeled).
export function line37(form: Form) {
  const paid = form["line.33"];
  const tax = form["line.24"];
  if (typeof paid !== "number" || typeof tax !== "number") return undefined;
  return tax > paid ? tax - paid + sum(form["line.38"]) : undefined;
}
