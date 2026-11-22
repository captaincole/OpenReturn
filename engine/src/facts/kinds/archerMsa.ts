/*
 * Archer MSA and Medicare Advantage MSA answers (Form 8853 Sections A and B).
 * Distributions come from Form 1099-SA (hsaDistribution.ts, box 5 "Archer MSA"
 * or "MA MSA"); employer contributions come from W-2 box 12 code R
 * (irs-8853-inst-2025::sec::line-1::b01). Each key here is one answer the
 * taxpayer states.
 */

export type ArcherMsaCoverage = "self-only" | "family";

/*
 * One stretch of 2025 with the same HDHP, for the Line 3 Limitation Chart
 * (irs-8853-inst-2025::sec::start-here::b01): the number of months on whose
 * first day the account holder was an eligible individual (an employee of a
 * small employer or self-employed, covered by this HDHP, no other health
 * coverage, not anyone's dependent) and not enrolled in Medicare. Months that
 * fail the test are left out: the chart enters -0- for them.
 */
export interface ArcherMsaCoveragePeriod {
  months: number;
  coverage: ArcherMsaCoverage;
  annualDeductible: number;
  /* Whose HDHP on a joint return; absent means the taxpayer's. */
  owner?: "taxpayer" | "spouse";
}

export const ARCHER_MSA_KEYS = {
  /* Line 3: ArcherMsaCoveragePeriod[]. */
  coverage: "hsa.archer_msa.coverage",
  /*
   * Line 3, married filing separately with family coverage: the filer's share
   * of the 75% amount when the spouses agree on a split other than one half
   * (irs-8853-inst-2025::sec::enter-0-on::b02). A number from 0 to 1.
   */
  familyLimitShare: "hsa.archer_msa.family_limit_share",
  /* Line 2: contributions the account holder made for 2025, rollovers left out. */
  ownContributions: "hsa.archer_msa.own_contributions",
  /* Line 4: compensation from the employer that maintains the HDHP (or self-employment earned income). */
  compensation: "hsa.archer_msa.compensation",
  /* Line 6b: distributions rolled over, and excess contributions withdrawn by the due date. */
  rolledOverOrExcessWithdrawn: "hsa.archer_msa.distributions_rolled_over",
  /* Line 7: unreimbursed qualified medical expenses paid with the distributions. */
  qualifiedMedicalExpenses: "hsa.archer_msa.qualified_medical_expenses",
  /*
   * Line 9b: the part of line 8 paid after the account holder died, became
   * disabled or turned 65 (irs-8853-inst-2025::sec::exceptions-to-the-additional-20-tax::b01).
   * Asked when the facts cannot tell (a 65th birthday in 2025, spouses with
   * different answers); used whenever stated.
   */
  exceptedTaxableDistributions: "hsa.archer_msa.excepted_taxable_distributions",
} as const;

export const MEDICARE_ADVANTAGE_MSA_KEYS = {
  /* Line 11: distributions used only for the account holder's qualified medical expenses. */
  qualifiedMedicalExpenses: "hsa.medicare_advantage_msa.qualified_medical_expenses",
  /* Line 13b worksheet line 1: the part of line 12 paid on or after death or disability. */
  exceptedTaxableDistributions: "hsa.medicare_advantage_msa.excepted_taxable_distributions",
  /* Worksheet line 2: the account's value on December 31, 2024; 0 when there was no account. */
  valueEndOf2024: "hsa.medicare_advantage_msa.value_end_of_2024",
  /* Worksheet line 3: the HDHP's annual deductible on January 1, 2025. */
  annualDeductible: "hsa.medicare_advantage_msa.annual_deductible",
} as const;

type FactRow = { key: string; value: unknown };

const numberValue = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/* The value of one answer: a number, or undefined when it is missing or not a number. */
export function numberAnswer(facts: ReadonlyArray<FactRow>, key: string): number | undefined {
  return numberValue(facts.find((fact) => fact.key === key)?.value);
}

/* The coverage periods, or undefined when the answer is missing or not a list. */
export function archerMsaCoverage(
  facts: ReadonlyArray<FactRow>,
): ArcherMsaCoveragePeriod[] | undefined {
  const value = facts.find((fact) => fact.key === ARCHER_MSA_KEYS.coverage)?.value;
  return Array.isArray(value) ? (value as ArcherMsaCoveragePeriod[]) : undefined;
}
