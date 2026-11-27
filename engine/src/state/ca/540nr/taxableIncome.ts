/*
 * Form 540NR total taxable income: lines 12 to 19, figured as if a
 * California resident for the entire year
 * (ca-540nr-booklet-2025::sec::how-nonresidents-and-part-year-residents-are-taxed::b01).
 * Lines 13 to 17 and 19 are Form 540's rules (fromForm540.ts): they read the
 * same federal AGI and Schedule CA line 27 columns B and C.
 */

import { numberOrBlank, roundDollars } from "../../../money.js";
import * as form540 from "../540/taxableIncome.js";
import { partIIUnsupported } from "../schedule-ca/increasedStandard.js";
import type { Form540NRLine } from "./form540NRBinding.js";
import { fromForm540 } from "./fromForm540.js";

export const line13FederalAgi = fromForm540<"1.line.13_federal_agi", "line.13_federal_agi">(
  form540.line13FederalAgi,
);
// Lines 14 and 16: Schedule CA (540NR) line 27 columns B and C, a negative column moving to the other line.
export const line14CaAdjustmentsSubtractions = fromForm540<
  "1.line.14_ca_adjustments_subtractions",
  "line.14_ca_adjustments_subtractions"
>(form540.line14CaAdjustmentsSubtractions);
export const line15AgiBeforeAdditions = fromForm540<
  "1.line.15_agi_before_additions",
  "line.15_ca_agi_before_additions"
>(form540.line15CaAgiBeforeAdditions);
export const line16CaAdjustmentsAdditions = fromForm540<
  "1.line.16_ca_adjustments_additions",
  "line.16_ca_adjustments_additions"
>(form540.line16CaAdjustmentsAdditions);
export const line17AgiAllSources = fromForm540<"1.line.17_agi_all_sources", "line.17_ca_agi">(
  form540.line17CaAgi,
);
export const line19TotalTaxableIncome = fromForm540<
  "1.line.19_total_taxable_income",
  "line.19_taxable_income"
>(form540.line19TaxableIncome);

/*
 * Line 12: "Enter the total amount of your California wages from your federal
 * Form(s) W-2 ... box 16" (ca-540nr-booklet-2025::sec::line-12-california-wages::b01):
 * the W-2s whose state box names California or no state (resolveInfo.ts).
 */
export const line12StateWages: Form540NRLine<"1.line.12_state_wages"> = (_, info) =>
  roundDollars(info.w2CaliforniaWages);

/*
 * Line 18: "Enter the larger of: Your California itemized deductions from
 * Schedule CA (540NR), Part III, line 30; OR Your California standard
 * deduction" (the form). Part III line 30 is that larger amount
 * (ca-540nr-sched-ca-inst-2025::sec::line-30-amount-from-line-29-or-standard-deduction::b01).
 * While Part III is a gap (the federal increased standard deduction, a Form
 * 4684 gap), line 18 has the same gap, as on Form 540.
 */
export const line18Deductions: Form540NRLine<"1.line.18_deductions"> = (form, info) =>
  numberOrBlank(form["schedule-ca-540nr.4.part3.30_itemized_or_standard_deduction"]) ??
  partIIUnsupported(info);
