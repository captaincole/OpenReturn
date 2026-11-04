export const SPOUSE_KEYS = {
  firstName: "identity.spouse.name.first",
  middleInitial: "identity.spouse.name.middle_initial",
  lastName: "identity.spouse.name.last",
  ssn: "identity.spouse.ssn",
  /* 1040 line 12d and Schedule 1-A line 36b: born before January 2, 1961. */
  dob: "identity.spouse.dob",
  /* 1040 line 6d and the Social Security Benefits Worksheet base amount. */
  livedApartAllYear: "filing_status.lived_apart_from_spouse_all_year",
  /* 1040 line 12b: an MFS spouse who itemizes makes the standard deduction zero. */
  itemizesSeparately: "filing_status.spouse_itemizes",
} as const;
