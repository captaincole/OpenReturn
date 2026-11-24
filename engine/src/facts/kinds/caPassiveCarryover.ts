/*
 * FTB 3801 Part IV and Part V column (c): a rental or royalty property's
 * California prior year unallowed passive loss, a positive number, from last
 * year's FTB 3801. One fact per Schedule E property, keyed by the property's
 * id. California figures its own carryover: it uses California amounts, and it
 * treats every rental activity as passive, even a real estate professional's
 * (ca-3801-inst-2025::sec::material-participation-in-real-property-business-irc-section-469-c-7::b01).
 *
 * Cade records it when the California carryover differs from the federal one
 * (the rental fact's priorYearUnallowedLoss). Absent, FTB 3801 takes the
 * federal carryover. The form asks for it when the federal carryover cannot
 * stand in: the property has one, or it is not passive federally.
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
