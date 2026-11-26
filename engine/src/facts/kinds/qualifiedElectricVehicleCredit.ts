/*
 * Form 8834: a qualified electric vehicle credit from a passive activity that
 * an earlier year's Form 8582-CR did not allow. "Use this form to claim
 * qualified electric vehicle passive activity credits from prior years
 * (allowed on Form 8582-CR or Form 8810 for the current year). The qualified
 * electric vehicle credit was available for certain vehicles placed in service
 * before 2007" (irs-8834-form-2025::sec::face-page-1::b01). So no 2025 credit
 * exists: only the carryover.
 *
 * One fact per passive activity, from last year's return: its Form 8582-CR
 * Worksheet 9 column (b), or its line 5 less line 37 when it was the only
 * credit (irs-8582cr-inst-2025::sec::prior-year-unallowed-credits::b01). It
 * goes in column (b) of Worksheet 1 or 4 of this year's Form 8582-CR
 * (irs-8582cr-inst-2025::sec::form-8834-qualified-electric-vehicle-credit-see-the::b01).
 *
 * Not this fact: prior_year.unallowed_qualified_electric_vehicle_credit
 * (priorYearMinimumTax.ts) is the credit last year's Form 8834 lost to the tax
 * limit (its line 1 less line 7), which Form 8801 line 20 takes.
 */

import type { PassiveCreditActivity } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

export interface ElectricVehiclePassiveCreditFactValue {
  /* The unallowed credit carried to 2025, in dollars. */
  amount: number;
  /*
   * The passive activity the vehicle was used in. Rental real estate with
   * active participation, in the year the credit arose and in 2025, puts it on
   * Worksheet 1; any other activity on Worksheet 4
   * (irs-8582cr-inst-2025::sec::lines-1a-through-1c::b02).
   */
  activity: PassiveCreditActivity;
}

export interface ElectricVehiclePassiveCreditFact {
  key: string;
  value: ElectricVehiclePassiveCreditFactValue;
}

const ELECTRIC_VEHICLE_CATEGORY = "other";
const ELECTRIC_VEHICLE_PREFIX = "electric_vehicle_credit.passive_carryover.";

export function makeElectricVehiclePassiveCreditFactKey(slug: string): string {
  return `${ELECTRIC_VEHICLE_PREFIX}${slug}`;
}

export function isElectricVehiclePassiveCreditFactKey(key: string): boolean {
  const slug = key.slice(ELECTRIC_VEHICLE_PREFIX.length);
  return key.startsWith(ELECTRIC_VEHICLE_PREFIX) && slug !== "" && !slug.includes(".");
}

/* Every carryover fact, in the order recorded: the order of the worksheet rows. */
export function getElectricVehiclePassiveCreditFacts(
  facts: ReadonlyArray<FactRow>,
): ElectricVehiclePassiveCreditFact[] {
  return facts
    .filter(
      (row) =>
        row.category === ELECTRIC_VEHICLE_CATEGORY &&
        isElectricVehiclePassiveCreditFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as ElectricVehiclePassiveCreditFactValue }));
}
