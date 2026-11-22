/*
 * Form 540 payments: lines 71 to 78. The other forms' withholding that line
 * 71 adds is read in withholding.ts.
 */

import { roundDollars, sum, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { caEitcOutcome, creditLine, NONE, type CaCreditOutcome } from "../3514/credit.js";
import { fytcOutcome, yctcOutcome } from "../3514/youngChildAndFosterYouth.js";
import type { Form540FilingInfo } from "./filingInfo.js";
import type { Form540Form, Form540Line } from "./form540Binding.js";

/* MANUAL EDIT: FTB 3514's EITC, YCTC and FYTC; no credit when the form does not file. */
type Ftb3514Outcome = (form: Form540Form, info: Form540FilingInfo) => CaCreditOutcome;

const ftb3514Credit =
  (outcome: Ftb3514Outcome): Ftb3514Outcome =>
  (form, info) =>
    info.mustFile?.["form-3514"]?.value === true ? outcome(form, info) : NONE;

const FTB_3514_CREDITS = {
  eitc: ftb3514Credit(caEitcOutcome),
  yctc: ftb3514Credit(yctcOutcome),
  fytc: ftb3514Credit(fytcOutcome),
};

function ftb3514Credits(form: Form540Form, info: Form540FilingInfo): CaCreditOutcome[] {
  return Object.values(FTB_3514_CREDITS).map((credit) => credit(form, info));
}

/*
 * MANUAL EDIT: round the W-2 box 17 sum to the nearest dollar.
 * MANUAL EDIT: W-2 box 17 and the other forms' California withholding (withholding.ts).
 */
export const line71CaIncomeTaxWithheld: Form540Line<"line.71_ca_income_tax_withheld"> = (_, info) =>
  roundDollars(sumOrBlank(info.w2StateWithholding, info.caWithholdingOtherForms));

// MANUAL EDIT: the total of the stated payments (ca-540-inst-2025::sec::line-72-2025-california-estimated-tax-and-other-payments::b01).
export const line72CaEstimatedTaxPayments: Form540Line<"line.72_ca_estimated_tax_payments"> = (
  _,
  info,
) => roundDollars(info.caEstimatedAndOtherPayments);

/*
 * MANUAL EDIT: lines 75–77 take FTB 3514 lines 20, 28 and 39
 * (ca-540-inst-2025, lines 75–77; ca-3514-inst-2025::sec::part-iii-your-earned-income-tax-credit::b01,
 * ::line-28-young-child-tax-credit::b01, ::line-39-foster-youth-tax-credit::b01).
 * Blank when the form does not file or a credit does not apply.
 */
export const line75Eitc: Form540Line<"line.75_eitc"> = (form, info) =>
  creditLine(FTB_3514_CREDITS.eitc(form, info));
export const line76YoungChildTaxCredit: Form540Line<"line.76_young_child_tax_credit"> = (
  form,
  info,
) => creditLine(FTB_3514_CREDITS.yctc(form, info));
export const line77FosterYouthTaxCredit: Form540Line<"line.77_foster_youth_tax_credit"> = (
  form,
  info,
) => creditLine(FTB_3514_CREDITS.fytc(form, info));

/*
 * MANUAL EDIT: FTB 3514 files and a credit is still unknown: the total
 * waits (or is a gap), because sum() would read its blank line as 0.
 */
export const line78TotalPayments: Form540Line<"line.78_total_payments"> = (form, info) => {
  const credits = ftb3514Credits(form, info);
  if (credits.some((outcome) => outcome.kind === "waiting")) return undefined;
  // A credit the engine cannot figure would count as 0: the total is not known either.
  const gap = credits.find((outcome) => outcome.kind === "unsupported");
  if (gap?.kind === "unsupported") return unsupported(gap.reason);
  return sum(
    form["line.71_ca_income_tax_withheld"],
    form["line.72_ca_estimated_tax_payments"],
    form["line.73_withholding_592b_593"],
    form["line.74_motion_picture_production_credit"],
    form["line.75_eitc"],
    form["line.76_young_child_tax_credit"],
    form["line.77_foster_youth_tax_credit"],
  );
};
