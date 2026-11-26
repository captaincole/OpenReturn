import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { penaltyOnReturn } from "../2210/receivers.js";
import { line12From4136 } from "../4136/receivers.js";
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

/*
 * MANUAL EDIT: line 26 = the 2025 estimated tax payments and the 2024
 * overpayment applied to 2025 (irs-1040-inst-2025::sec::line-26::b01); blank with none.
 */
export const line26 = (_: unknown, info: Form1040FilingInfo) => info.estimatedTaxPaid;

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

const LINE_31_WITHOUT_SCHEDULE_3 =
  "Amount from Schedule 3 line 15 (additional refundable credits/payments) — Schedule 3 not ingested as a separate form catalog yet.";

/*
 * MANUAL EDIT: line 31, "Amount from Schedule 3, line 15". Schedule 3 line 15
 * holds an amount only with Form 4136: its line 12, the one Part II line the
 * engine computes. The line reads Form 4136's slots, not Schedule 3's field:
 * a read of Schedule 3 from Form 1040 adds fixpoint passes to every return.
 * Without Form 4136, the old reason.
 */
export function line31(_form: Form, info: Form1040FilingInfo) {
  const received = line12From4136(info);
  return received === undefined ? unsupported(LINE_31_WITHOUT_SCHEDULE_3) : received.value;
}

/*
 * MANUAL EDIT: line 32 adds lines 27a to 31; blank when every line is blank.
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

/*
 * MANUAL EDIT: line 35a = line 34 only when the full overpayment is refunded,
 * less the line 38 penalty: "subtract the penalty from the amount you would
 * otherwise enter on line 35a ... If the penalty is more than the overpayment
 * on line 34, enter -0- on lines 35a and 36"
 * (irs-1040-inst-2025::sec::figuring-the-penalty::b01). Waits for Form 2210.
 */
export function line35a(form: Form, info: Form1040FilingInfo) {
  if (!info.refundFullOverpaymentFederal) return undefined;
  const overpaid = form["line.34"];
  const penalty = penaltyOnReturn(form, info);
  if (penalty === "waiting" || typeof overpaid !== "number") return undefined;
  if ("unsupported" in penalty) return penalty;
  return atLeast(0, overpaid - sum(penalty.penalty));
}

/*
 * MANUAL EDIT: the line 35a box: "Check the box on line 35a and attach Form 8888
 * if you want to split the direct deposit of your refund into more than one
 * account" (irs-1040-inst-2025::sec::starting-in-october-2025-the-irs::b01).
 * Checked when Form 8888 line 5 carries the refund; blank otherwise.
 */
export function line35aForm8888Attached(form: Form) {
  const total = form["form-8888.0.line.5_total_allocation_refund"];
  return typeof total === "number" && total > 0 ? true : undefined;
}

/*
 * MANUAL EDIT: line 37 includes the line 38 penalty: "Add the penalty to any
 * tax due", and when the penalty is more than the line 34 overpayment,
 * "subtract line 34 from line 38 and enter the result on line 37"
 * (irs-1040-inst-2025::sec::figuring-the-penalty::b01). Waits for Form 2210.
 */
export function line37(form: Form, info: Form1040FilingInfo) {
  const paid = form["line.33"];
  const tax = form["line.24"];
  const penalty = penaltyOnReturn(form, info);
  if (typeof paid !== "number" || typeof tax !== "number" || penalty === "waiting") {
    return undefined;
  }
  if ("unsupported" in penalty) return penalty;
  const owed = tax - paid + sum(penalty.penalty);
  return owed > 0 ? owed : undefined;
}

/* MANUAL EDIT: line 38 = Form 2210 line 19 when the form figures the penalty; blank otherwise. */
export function line38(form: Form, info: Form1040FilingInfo) {
  const penalty = penaltyOnReturn(form, info);
  if (penalty === "waiting") return undefined;
  return "unsupported" in penalty ? penalty : penalty.penalty;
}
