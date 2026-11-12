/*
 * The passive activity tests for a rental or royalty property, shared by
 * Schedule E, Form 8582, Form 8995-A and Form 8960. Facts come first; the forms
 * read these tests, so the dependencies run one way: facts → Schedule E → Form 8582.
 */

import type { RentalFactValue } from "../../facts/index.js";

/* irs-8582-inst-2025::sec::rental-activities::b01, exception 1a: an average customer use of 7 days or less. */
const SHORT_STAY_DAYS = 7;

/* A yes/no answer, or undefined while it is unstated. */
export const booleanFact = (value: unknown) => (typeof value === "boolean" ? value : undefined);

/*
 * A spouse's or a jointly owned property is on this return only when filing
 * jointly; an unknown filing status counts it until the status is known.
 */
export const spousePropertiesOnReturn = (status: string | undefined) =>
  status === undefined || status === "married_filing_jointly";

/*
 * Real estate only. rental-activities::b01: an average period of customer use of
 * 7 days or less is not a rental activity (exception 1a). Undefined while a
 * short-term rental's average is unstated. Exception 1b (30 days or less with
 * significant personal services) and exceptions 2–5 have no facts: they are
 * taken not to apply.
 */
export function isRentalActivity(value: RentalFactValue): boolean | undefined {
  const days = value.averageCustomerUseDays;
  if (days === undefined) return value.propertyType === "vacation_short_term" ? undefined : true;
  return days > SHORT_STAY_DAYS;
}

/*
 * Whether a property is a passive activity, or undefined while an answer is missing.
 * A rental is passive unless the owner is a real estate professional who materially
 * participated in it (irs-8582-inst-2025::sec::activities-that-are-not-passive::b01, items 1–2);
 * a royalty is passive only when it comes from a trade or business the owner did
 * not materially participate in (royaltyActivity). A stay of 7 days or less is not a
 * rental activity (irs-8582-inst-2025::sec::rental-activities::b01): as a trade or
 * business it is passive unless the owner materially participated
 * (irs-8582-inst-2025::sec::reporting-income-and-losses-from-the::b01). A home with
 * personal use (item 4) has no rule here: Schedule E line 21 waits on personal-use days.
 */
export function isPassiveActivity(
  property: RentalFactValue,
  realEstateProfessional: boolean | undefined,
): boolean | undefined {
  if (property.propertyType === "royalties") {
    return property.royaltyActivity === undefined
      ? undefined
      : property.royaltyActivity === "passive";
  }
  const rental = isRentalActivity(property);
  if (rental === undefined) return undefined;
  if (rental && realEstateProfessional === undefined) return undefined;
  if (rental && !realEstateProfessional) return true;
  return property.materiallyParticipated === undefined
    ? undefined
    : !property.materiallyParticipated;
}

/*
 * The real estate professional answer decides only a rental activity: not a
 * royalty, and not a stay of 7 days or less.
 */
export function needsProfessionalAnswer(values: RentalFactValue[]): boolean {
  return values.some(
    (value) => value.propertyType !== "royalties" && isRentalActivity(value) !== false,
  );
}
