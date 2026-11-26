/*
 * A partnership or S corporation K-1's general business credit (the
 * business_credit items of passThrough, by the detail the box tables set) and
 * its Part III line. The K-1 instructions name each line: "Report this amount
 * on Form 7213 ... or Form 3800, Part III, line 1u" (irs-1065k1-inst-2025::sec::box-15-credits::b02
 * to ::b12; irs-1120sk1-inst-2025::sec::report-on-form-7207-advanced-manufacturing::b03
 * to ::b05, the same lines). A credit whose instructions send it to its source
 * form first (Form 3468, Form 8864), or to the entity's statement, keeps a gap
 * on the line it would reach.
 */

import { roundDollars } from "../../money.js";
import { gap, type Cell } from "./cells.js";

interface K1CreditLine {
  line: string;
  /* Why the engine cannot place the amount: it needs a source form or a statement. */
  needs?: string;
  /* A rental activity's credit: passive for the owner (box-15-credits::b03, ::b04). */
  rental?: boolean;
}

const FORM_3468 =
  "The investment credit must be figured on Form 3468 (irs-3800-inst-2025::sec::general-instructions::b01), which the engine does not have.";
const FORM_8864 =
  "The biodiesel, renewable diesel, or sustainable aviation fuels credit is reported on Form 8864 first (irs-1065k1-inst-2025::sec::box-15-credits::b01, ::b09), which the engine does not have.";
const STATEMENT =
  "The entity's statement names the credit and its Form 3800 line (irs-1065k1-inst-2025::sec::box-15-credits::b04, ::b12), and the K-1 fact does not hold it.";

export const RESEARCH_DETAIL = "research";

/* Detail (passThrough box tables) → Part III line. */
export const K1_CREDIT_LINES: Readonly<Record<string, K1CreditLine>> = {
  zero_emission_nuclear: { line: "1u" },
  advanced_nuclear: { line: "1cc" },
  low_income_housing_42j5: { line: "4d", rental: true },
  low_income_housing_other: { line: "4d", rental: true },
  rehabilitation_rental: { line: "4k", needs: FORM_3468, rental: true },
  other_rental_real_estate: { line: "1zz", needs: STATEMENT, rental: true },
  other_rental: { line: "1zz", needs: STATEMENT, rental: true },
  biofuel_producer: { line: "4c" },
  work_opportunity: { line: "4b" },
  disabled_access: { line: "1e" },
  empowerment_zone: { line: "3" },
  // Line 1c or 4i by the eligible small business answer (box-15-credits::b06).
  [RESEARCH_DETAIL]: { line: "1c" },
  employer_social_security_on_tips: { line: "4f" },
  unused_coal: { line: "1a", needs: FORM_3468 },
  unused_advanced_energy: { line: "1d", needs: FORM_3468 },
  unused_manufacturing: { line: "1o", needs: FORM_3468 },
  unused_clean_electricity: { line: "1v", needs: FORM_3468 },
  unused_energy: { line: "4a", needs: FORM_3468 },
  unused_rehabilitation: { line: "4k", needs: FORM_3468 },
  advanced_manufacturing_production: { line: "1b" },
  clean_electricity_production: { line: "1gg" },
  clean_fuel_production: { line: "1q" },
  clean_hydrogen_production: { line: "1g" },
  orphan_drug: { line: "1h" },
  enhanced_oil_recovery: { line: "1t" },
  renewable_electricity_production: { line: "1f" },
  biodiesel: { line: "1l", needs: FORM_8864 },
  new_markets: { line: "1i" },
  pension_startup: { line: "1j" },
  auto_enrollment: { line: "1dd" },
  military_spouse_participation: { line: "1ee" },
  childcare: { line: "1k" },
  low_sulfur_diesel: { line: "1m" },
  railroad_track_maintenance: { line: "4g" },
  marginal_wells: { line: "1bb" },
  distilled_spirits: { line: "1n" },
  energy_efficient_home: { line: "1p" },
  refueling_property: { line: "1s" },
  differential_wage: { line: "1w" },
  carbon_oxide_sequestration: { line: "1x" },
  new_clean_vehicle: { line: "1y" },
  commercial_clean_vehicle: { line: "1aa" },
  small_employer_health: { line: "4h" },
  paid_family_leave: { line: "4j" },
  transferred_credits: { line: "1zz", needs: STATEMENT },
};

/* A detail the table does not know: an engine gap on line 1zz, never a dropped credit. */
const UNKNOWN: K1CreditLine = { line: "1zz", needs: STATEMENT };

export const k1CreditLineOf = (detail: string | undefined): K1CreditLine =>
  (detail === undefined ? undefined : K1_CREDIT_LINES[detail]) ?? UNKNOWN;

/* The item's amount in whole dollars, or the gap of a credit the engine cannot place. */
export function k1CreditAmount(detail: string | undefined, amount: number | undefined): Cell {
  const placed = k1CreditLineOf(detail);
  if (placed.needs !== undefined) return gap(placed.needs);
  return amount === undefined ? gap(STATEMENT) : roundDollars(amount);
}
