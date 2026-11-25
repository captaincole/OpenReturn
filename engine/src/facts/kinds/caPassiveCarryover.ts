/*
 * FTB 3801 Part IV and Part V column (c): a rental or royalty property's
 * California prior year unallowed passive loss, a positive number or 0. One
 * fact per Schedule E property, keyed by the property's id. The taxpayer reads
 * it from last year's FTB 3801, Side 3, Part VII column (c) "Unallowed loss",
 * on the property's row (irs-8582-inst-2025::sec::part-iv-2::b02: "You find
 * these amounts in Part VII, column (c), of your 2024 Form 8582"); 0 when the
 * property is not on that Part VII or no FTB 3801 was filed. California
 * figures its own carryover: it uses California amounts, and it treats every
 * rental activity as passive, even a real estate professional's
 * (ca-3801-inst-2025::sec::material-participation-in-real-property-business-irc-section-469-c-7::b01).
 *
 * FTB 3801 asks for it for every property that is passive for California,
 * whatever the federal carryover (the rental fact's priorYearUnallowedLoss):
 * the federal amount never stands in (state/ca/3801/californiaRentals.ts).
 */

type FactRow = { key: string; value: unknown; category: string };

const CARRYOVER_CATEGORY = "rental";
const CARRYOVER_PREFIX = "ca_passive.prior_year_unallowed_loss.";
const RENTAL_PREFIX = "rental.property.";

/* The carryover's key for a rental fact key (rental.property.<id>). */
export function makeCaPassiveCarryoverKey(rentalFactKey: string): string {
  const propertyId = rentalFactKey.startsWith(RENTAL_PREFIX)
    ? rentalFactKey.slice(RENTAL_PREFIX.length)
    : rentalFactKey;
  return `${CARRYOVER_PREFIX}${propertyId}`;
}

export function isCaPassiveCarryoverKey(key: string): boolean {
  return key.startsWith(CARRYOVER_PREFIX) && key.length > CARRYOVER_PREFIX.length;
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/* The stated carryover of a property; undefined when none is stated or it is not an amount. */
export function caPassiveCarryoverOf(
  facts: ReadonlyArray<FactRow>,
  rentalFactKey: string,
): number | undefined {
  const key = makeCaPassiveCarryoverKey(rentalFactKey);
  const row = facts.find((fact) => fact.category === CARRYOVER_CATEGORY && fact.key === key);
  return row && isAmount(row.value) ? row.value : undefined;
}
