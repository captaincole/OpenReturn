/*
 * Form 8839 answers (qualified adoption expenses and employer adoption benefits).
 * One fact per eligible child the taxpayer adopted or tried to adopt (Part I,
 * line 1), and three answers for the whole return. Employer benefits also come
 * from W-2 box 12 code T (the wages kind).
 *
 * Expenses are qualified adoption expenses: not reimbursed by an employer or
 * otherwise (irs-8839-inst-2025::sec::qualified-adoption-expenses::b01).
 * Several attempts to adopt one child are one fact, with the amounts combined
 * (irs-8839-inst-2025::sec::specific-instructions::b02).
 */

type FactRow = { key: string; value: unknown; category: string };

export interface AdoptionChildFactValue {
  /* Column (a). */
  firstName: string;
  lastName: string;
  /* Column (b). */
  birthYear: number;
  /* Column (c), with a birth year before 2008: physically or mentally unable to care for themselves. */
  disabled?: boolean;
  /* Column (d): a state or tribal government determined special needs (more-than-three-eligible-children::b01). */
  specialNeeds?: boolean;
  /* Column (e): not a U.S. citizen or resident when the adoption effort began. */
  foreign?: boolean;
  /* Column (f): the child's SSN, ATIN or ITIN; absent leaves the column blank. */
  tin?: string;
  /* The year the adoption became final; absent while it is not final, or for an attempt that failed. */
  finalYear?: number;
  /* Qualified expenses paid before 2024, in 2024 and in 2025 (line 5). */
  expensesPaidBefore2024?: number;
  expensesPaid2024?: number;
  expensesPaid2025?: number;
  /* Line 3: lines 3 and 6 of the last Form 8839 filed for this child; absent when none was filed. */
  priorYearCredit?: number;
  /* Line 2: the taxpayer's share of the limit when another person (not a joint spouse) adopts the same child. */
  creditLimitShare?: number;
  /* Line 22: the employer benefits received in 2025 for this child (W-2 box 12 code T). */
  employerBenefits2025?: number;
  /* Line 20: lines 20 and 24 of the last Form 8839 for this child; absent when there were none. */
  priorYearBenefits?: number;
  /* Line 19: the share of the exclusion limit, as for line 2. */
  exclusionLimitShare?: number;
  /* Employer benefits received before 2025 for a foreign child whose adoption became final in 2025. */
  foreignBenefitsBefore2025?: number;
}

export interface AdoptionChildFact {
  childSlug: string;
  child: AdoptionChildFactValue;
  factKey: string;
}

export const ADOPTION_KEYS = {
  /* Line 15: the credit carryforward from prior years (the 2024 carryforward worksheet). 0 when none. */
  creditCarryforward: "adoption.credit_carryforward",
  /* Line 24: the employer has a written qualified adoption assistance program (line-24::b01). */
  employerHasQualifiedProgram: "adoption.employer_has_qualified_program",
  /*
   * Married filing separately: lived apart from the spouse the last 6 months of
   * 2025, the child lived in the home more than half of 2025, and the taxpayer
   * paid over half its cost (married-persons-not-filing-jointly::b01).
   */
  marriedSeparatelyTreatedAsUnmarried: "adoption.mfs_treated_as_unmarried",
} as const;

const ADOPTION_CATEGORY = "dependents";
const CHILD_PREFIX = "adoption.child.";

export function makeAdoptionChildFactKey(childSlug: string): string {
  return `${CHILD_PREFIX}${childSlug}`;
}

/* The slug after the prefix, with no further dots; undefined for any other key. */
function childSlugOf(key: string): string | undefined {
  if (!key.startsWith(CHILD_PREFIX)) return undefined;
  const slug = key.slice(CHILD_PREFIX.length);
  return slug === "" || slug.includes(".") ? undefined : slug;
}

export function isAdoptionChildFactKey(key: string): boolean {
  return childSlugOf(key) !== undefined;
}

/* Every adoption child, in the order recorded: the order of line 1's rows. */
export function getAdoptionChildFacts(facts: ReadonlyArray<FactRow>): AdoptionChildFact[] {
  return facts.flatMap((row) => {
    const slug = childSlugOf(row.key);
    return row.category === ADOPTION_CATEGORY && slug !== undefined
      ? [{ childSlug: slug, child: row.value as AdoptionChildFactValue, factKey: row.key }]
      : [];
  });
}
