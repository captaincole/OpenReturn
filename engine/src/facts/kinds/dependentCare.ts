/*
 * Form 2441 answers (child and dependent care expenses). One fact per care
 * provider (Part I, line 1) and one per qualifying person (Part II, line 2).
 * Dependent care benefits come from W-2 box 10; the other Part III amounts
 * are answers.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface DependentCareProviderFactValue {
  /* Column (a). */
  name: string;
  /* Column (b). */
  address: { line1: string; city: string; state: string; zip: string };
  /* Column (c): the provider's SSN or EIN. A tax-exempt organization enters "Tax-Exempt". */
  tin?: string;
  taxExempt?: boolean;
  /* Column (d): the provider was the taxpayer's household employee (a nanny, not a daycare center). */
  householdEmployee: boolean;
  /* Column (e): the amount paid to the provider in the year. */
  amountPaid: number;
}

export interface DependentCareQualifyingPersonFactValue {
  /* The dependent fact (dependent.<slug>) that names the person; absent for a spouse or a person not claimed. */
  dependentSlug?: string;
  /* Column (a) and (b) when the person has no dependent fact. */
  firstName?: string;
  lastName?: string;
  ssn?: string;
  dob?: string; // MM/DD/YYYY
  /*
   * The person was physically or mentally unable to care for themselves
   * (irs-2441-inst-2025::sec::qualifying-person-s::b02). Column (c) checks it
   * for a person over age 12.
   */
  unableToCareForSelf?: boolean;
  /* Column (d): qualified expenses incurred and paid in the year for this person. */
  expensesPaid: number;
}

export interface DependentCareProviderFact {
  providerSlug: string;
  provider: DependentCareProviderFactValue;
  factKey: string;
}

export interface DependentCareQualifyingPersonFact {
  personSlug: string;
  person: DependentCareQualifyingPersonFactValue;
  factKey: string;
}

export const DEPENDENT_CARE_KEYS = {
  /* Line 9b: qualified 2024 expenses paid in 2025 (Worksheet A). 0 when none. */
  priorYearExpensesPaid: "dependent_care.prior_year_expenses_paid",
  /*
   * Line A (married filing separately): lived apart from the spouse the last 6
   * months, the home was the qualifying person's main home more than half the
   * year, and paid over half its cost (married-persons-filing-separately::b01).
   */
  marriedSeparatelyTreatedAsUnmarried: "dependent_care.mfs_treated_as_unmarried",
  /*
   * Line B (married filing jointly): either spouse was a full-time student or
   * unable to care for themselves during the year, which may give deemed
   * earned income (if-you-or-your-spouse-was-a-student-or-disabled::b01).
   */
  studentOrDisabledSpouse: "dependent_care.student_or_disabled_spouse",
  /* Line 13: the amount carried over from 2024 and used in the grace period. */
  benefitsGracePeriodCarryover: "dependent_care.benefits_grace_period_carryover",
  /* Line 14: the benefits forfeited or carried forward to 2026. */
  benefitsForfeited: "dependent_care.benefits_forfeited",
  /* Line 16: qualified expenses incurred in 2025, whenever paid. */
  expensesIncurred: "dependent_care.expenses_incurred",
  /* Line 21: the most the dependent care plan lets the taxpayer exclude, when under $5,000. */
  planExclusionLimit: "dependent_care.plan_exclusion_limit",
} as const;

const DEPENDENT_CARE_CATEGORY = "dependents";
const PROVIDER_PREFIX = "dependent_care.provider.";
const PERSON_PREFIX = "dependent_care.qualifying_person.";

export function makeDependentCareProviderFactKey(providerSlug: string): string {
  return `${PROVIDER_PREFIX}${providerSlug}`;
}

export function makeDependentCareQualifyingPersonFactKey(personSlug: string): string {
  return `${PERSON_PREFIX}${personSlug}`;
}

/* The slug after the prefix, with no further dots; undefined for any other key. */
function slugAfter(key: string, prefix: string): string | undefined {
  if (!key.startsWith(prefix)) return undefined;
  const slug = key.slice(prefix.length);
  return slug === "" || slug.includes(".") ? undefined : slug;
}

export function isDependentCareProviderFactKey(key: string): boolean {
  return slugAfter(key, PROVIDER_PREFIX) !== undefined;
}

export function isDependentCareQualifyingPersonFactKey(key: string): boolean {
  return slugAfter(key, PERSON_PREFIX) !== undefined;
}

/* Every care provider, in the order recorded: the order of line 1's rows. */
export function getDependentCareProviderFacts(
  facts: ReadonlyArray<FactRow>,
): DependentCareProviderFact[] {
  return facts.flatMap((row) => {
    const slug = slugAfter(row.key, PROVIDER_PREFIX);
    return row.category === DEPENDENT_CARE_CATEGORY && slug !== undefined
      ? [
          {
            providerSlug: slug,
            provider: row.value as DependentCareProviderFactValue,
            factKey: row.key,
          },
        ]
      : [];
  });
}

/* Every qualifying person, in the order recorded: the order of line 2's rows. */
export function getDependentCareQualifyingPersonFacts(
  facts: ReadonlyArray<FactRow>,
): DependentCareQualifyingPersonFact[] {
  return facts.flatMap((row) => {
    const slug = slugAfter(row.key, PERSON_PREFIX);
    return row.category === DEPENDENT_CARE_CATEGORY && slug !== undefined
      ? [
          {
            personSlug: slug,
            person: row.value as DependentCareQualifyingPersonFactValue,
            factKey: row.key,
          },
        ]
      : [];
  });
}
