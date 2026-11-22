/* Form 540 taxable income: lines 12 to 19. */

import { lookupStandardDeduction } from "../../../data/standardDeduction.js";
import { atLeast, roundDollars, sum } from "../../../money.js";
import { partIIUnsupported } from "../schedule-ca/increasedStandard.js";
import type { Form540Line } from "./form540Binding.js";

// MANUAL EDIT: round the W-2 box 16 sum to the nearest dollar.
export const line12StateWages: Form540Line<"line.12_state_wages"> = (_, info) =>
  roundDollars(info.w2StateWages);

export const line13FederalAgi: Form540Line<"line.13_federal_agi"> = (form) =>
  sum(form["form-1040.line.11b"]);

/*
 * The amount Form 540 line 14 or 16 takes from Schedule CA line 27: its own
 * column when positive, plus the other column's negative as a positive amount.
 */
function adjustmentFromLine27(ownColumn: unknown, otherColumn: unknown): number {
  const own = typeof ownColumn === "number" && ownColumn > 0 ? ownColumn : 0;
  const other = typeof otherColumn === "number" && otherColumn < 0 ? -otherColumn : 0;
  return own + other;
}

/*
 * MANUAL EDIT: line 14 takes Schedule CA line 27 column B, and line 16 column C.
 * A negative column moves to the other line as a positive amount. Both lines
 * are 0 when Schedule CA is not filed
 * (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b08;
 * ca-540-inst-2025::sec::line-14-california-adjustments-subtractions-from-schedule-ca-540-part-i-line-27-column-b::b01;
 * ca-540-inst-2025::sec::line-16-california-adjustments-additions-from-schedule-ca-540-part-i-line-27-column-c::b01).
 */
export const line14CaAdjustmentsSubtractions: Form540Line<"line.14_ca_adjustments_subtractions"> = (
  form,
) =>
  adjustmentFromLine27(
    form["schedule-ca.3.line.c27_subtractions"],
    form["schedule-ca.3.line.c27_additions"],
  );

export const line15CaAgiBeforeAdditions: Form540Line<"line.15_ca_agi_before_additions"> = (form) =>
  sum(
    form["line.13_federal_agi"],
    form["line.14_ca_adjustments_subtractions"] === undefined
      ? 0
      : -form["line.14_ca_adjustments_subtractions"],
  );

export const line16CaAdjustmentsAdditions: Form540Line<"line.16_ca_adjustments_additions"> = (
  form,
) =>
  adjustmentFromLine27(
    form["schedule-ca.3.line.c27_additions"],
    form["schedule-ca.3.line.c27_subtractions"],
  );

export const line17CaAgi: Form540Line<"line.17_ca_agi"> = (form) =>
  sum(form["line.15_ca_agi_before_additions"], form["line.16_ca_adjustments_additions"]);

// MANUAL EDIT: Schedule CA line 30 when filed, else the standard deduction (same value for non-itemizers).
export const line18Deductions: Form540Line<"line.18_deductions"> = (form, info) => {
  const fromScheduleCA = form["schedule-ca.5.page2.total_itemized_30_standard_or_itemized"];
  if (typeof fromScheduleCA === "number") return fromScheduleCA;
  // MANUAL EDIT: a person completes Schedule CA Part II, line 30 included; so line 18 too.
  const partIIOpen =
    info.increasedStandardDeduction !== false && info.mustFile?.["schedule-ca"]?.value === true;
  if (partIIOpen) return partIIUnsupported(info);
  return info.filingStatus
    ? lookupStandardDeduction("state-ca", 2025, info.filingStatus)
    : undefined;
};

// MANUAL EDIT: lines 19 to 115 wait with the line they read; 0 would print a wrong tax.
export const line19TaxableIncome: Form540Line<"line.19_taxable_income"> = (form) => {
  const deductions = form["line.18_deductions"];
  if (typeof deductions !== "number") return undefined;
  return atLeast(0, sum(form["line.17_ca_agi"], -deductions));
};
