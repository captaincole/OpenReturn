/*
 * FTB 3532 (Head of Household Filing Status Schedule) answers, category
 * filing_status. California requires the form with head of household status
 * (ca-3532-inst-2025::sec::general-information::b02).
 */

export const HEAD_OF_HOUSEHOLD_KEYS = {
  /* Line 1: one of CA_HOH_MARITAL_STATUSES. */
  caMaritalStatus: "filing_status.ca_hoh_marital_status",
  /*
   * Line 1f: each period the taxpayer lived with the spouse/RDP during the year,
   * an array of { from, to } dates, MM/DD/YYYY.
   */
  livedWithSpousePeriods: "filing_status.ca_hoh_lived_with_spouse_periods",
  /* Lines 2–5: the qualifying person's dependentId (the <id> of dependent.<id>, as record-dependent returns it), when the return has more than one dependent. */
  qualifyingPerson: "filing_status.hoh_qualifying_person",
} as const;

/* FTB 3532 line 1, boxes a–f, in the form's order. */
export const CA_HOH_MARITAL_STATUSES = [
  "not_married", // a: not legally married/RDP during the year
  "surviving_spouse", // b: the spouse/RDP died before the year began
  "annulled", // c: the marriage/RDP was annulled
  "divorced_or_separated", // d: final decree of divorce, legal separation or termination by December 31
  "married_lived_apart", // e: legally married/RDP and did not live with the spouse/RDP during the year
  "married_lived_together", // f: legally married/RDP and lived with the spouse/RDP during the year
] as const;

export type CaHohMaritalStatus = (typeof CA_HOH_MARITAL_STATUSES)[number];

export function isCaHohMaritalStatus(value: unknown): value is CaHohMaritalStatus {
  return (CA_HOH_MARITAL_STATUSES as readonly unknown[]).includes(value);
}

/* One line 1f period. */
export interface LivedWithSpousePeriod {
  from: string; // MM/DD/YYYY
  to: string; // MM/DD/YYYY
}
