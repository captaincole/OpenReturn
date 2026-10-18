/*
 * Spouse facts for a married taxpayer. A married-filing-separately
 * return names the spouse (1040 header, 540 line 3) and asks whether
 * the couple lived apart all year (1040 line 6d; the Social Security
 * Benefits Worksheet base amount).
 *
 * Convention:
 *   category: "identity" for the spouse's name and SSN,
 *             "filing_status" for the lived-apart answer
 *   keys:     see SPOUSE_KEYS
 */

export const SPOUSE_KEYS = {
  firstName: "identity.spouse.name.first",
  middleInitial: "identity.spouse.name.middle_initial",
  lastName: "identity.spouse.name.last",
  ssn: "identity.spouse.ssn",
  /* True when the taxpayer and spouse lived apart for all of 2025. */
  livedApartAllYear: "filing_status.lived_apart_from_spouse_all_year",
} as const;
