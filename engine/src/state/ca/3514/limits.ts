/*
 * FTB 3514's 2025 amounts (ca-3514-inst-2025). Tax year 2025 only, as the
 * federal EIC limits are.
 */

import { isYoungerThan } from "../../../federal/schedule-eic/qualifyingChild.js";

/* Step 1, question a, and B Differences: federal AGI and earned income "less than $32,901". */
export const CA_EITC_INCOME_LIMIT = 32_901;

/* Worksheet 1 line 13: "Is the amount on line 12 more than $4,814? Yes Stop here". */
export const CA_EITC_INVESTMENT_INCOME_LIMIT = 4_814;

/*
 * Worksheet Part II, line 5: below these federal AGIs (0, 1, 2 or more
 * qualifying children) the AGI needs no second table lookup.
 */
const AGI_SECOND_LOOKUP = [4_661, 6_998, 9_823] as const;

export const agiSecondLookupThreshold = (children: number) =>
  AGI_SECOND_LOOKUP[Math.min(children, 2)]!;

/* Lines 24 and 35: the YCTC and the FYTC for one claimant, $1,189 each. */
export const CA_YOUNG_CHILD_AND_FOSTER_YOUTH_CREDIT = 1_189;

/* Lines 25 and 36: "Subtract $27,425". */
export const CA_YCTC_FYTC_PHASE_OUT_THRESHOLD = 27_425;

/* Lines 27 and 38: the reduction "for every $100 over the threshold", $21.71, in cents. */
export const CA_YCTC_FYTC_REDUCTION_CENTS_PER_100 = 2_171;

/* Line 23a and 23b: wages, or a total net loss, over $35,640 stop the YCTC at zero earned income. */
export const CA_YCTC_ZERO_INCOME_LIMIT = 35_640;

/* Line 23b: "your federal AGI exceeds $32,900". */
export const CA_YCTC_ZERO_INCOME_AGI_LIMIT = 32_900;

/*
 * Step 4, question b: "at least age 18 at the end of 2025? (Answer "Yes" if
 * you ... were born on or before January 1, 2008.)" Undefined without a date.
 */
export function atLeast18(dob: string | undefined): boolean | undefined {
  const younger = isYoungerThan(dob, "01/01/2008");
  return younger === undefined ? undefined : !younger;
}

/*
 * Step 10: "at least 18 years old and younger than 26 years old as of the last
 * day of the taxable year". Ages count as Step 4's do: a January 1 birthday
 * reaches the age on December 31, so younger than 26 is born after January 1, 2000.
 */
export function fosterYouthAge(dob: string | undefined): boolean | undefined {
  const adult = atLeast18(dob);
  const under26 = isYoungerThan(dob, "01/01/2000");
  return adult === undefined || under26 === undefined ? undefined : adult && under26;
}
