/*
 * Form 8615: the child's answers and the parent's return, for a child whose
 * unearned income over $2,700 is taxed at the parent's rate
 * (irs-8615-inst-2025::sec::general-instructions::b01). The return is the
 * child's: the taxpayer is the child. Category other.
 *
 * The parent's amounts come from the parent's Form 1040, which the child (or
 * the person who prepares the child's return) asks the parent for
 * (irs-8615-inst-2025::sec::incomplete-information-for-filing::b01). They are
 * answers: the engine does not read another person's return.
 */

/* The parent's filing status, line C. The same strings as decisions.scope.filing_status. */
export const PARENT_FILING_STATUSES = [
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
  "qualifying_surviving_spouse",
] as const;

export type ParentFilingStatus = (typeof PARENT_FILING_STATUSES)[number];

export function isParentFilingStatus(value: unknown): value is ParentFilingStatus {
  return (PARENT_FILING_STATUSES as readonly unknown[]).includes(value);
}

/*
 * Another child whose Form 8615 uses the same parent's return (line 7,
 * irs-8615-inst-2025::sec::line-7::b01). Each amount is from that child's own
 * Form 8615 and its Line 5 Worksheet (::line-8::b02, ::line-8::b03).
 */
export interface OtherChildForm8615 {
  /* That child's Form 8615 line 5. */
  netUnearnedIncome: number;
  /* The qualified dividends included on that line 5 (its Line 5 Worksheet). Absent: none. */
  qualifiedDividends?: number;
  /* The net capital gain included on that line 5 (its Line 5 Worksheet). Absent: none. */
  netCapitalGain?: number;
  /* That child has 28% rate gain or unrecaptured section 1250 gain (Schedule D line 18 or 19). Absent: no. */
  hasRate28OrSection1250Gain?: boolean;
  /* That child files Form 2555. Absent: no. */
  filesForm2555?: boolean;
}

export interface ParentReturnFactValue {
  /* Line A: the parent named first on a joint return, or the parent the instructions pick (::specific-instructions::b01). */
  name: string;
  /* Line B. */
  ssn: string;
  /* Line C. */
  filingStatus: ParentFilingStatus;
  /* Line 6: the parent's Form 1040 line 15, as the parent's return shows it (a loss is allowed; line 6 enters 0). */
  taxableIncome: number;
  /*
   * Line 10: the parent's Form 1040 line 16, without the tax from Form 4972,
   * Form 8814 or the recapture of an education credit (irs-8615-inst-2025::sec::line-10::b01).
   */
  tax: number;
  /* The parent's Form 1040 line 3a: the qualified dividends on line 6 (::line-8::b02). Absent: none. */
  qualifiedDividends?: number;
  /*
   * The parent's net capital gain: the smaller of the gains on Schedule D lines
   * 15 and 16, or Form 1040 line 7a without Schedule D (::line-8::b01). Absent: none.
   */
  netCapitalGain?: number;
  /* The parent has 28% rate gain or unrecaptured section 1250 gain (Schedule D line 18 or 19). Absent: no. */
  hasRate28OrSection1250Gain?: boolean;
  /* The parent elected to treat qualified dividends or capital gain as investment income (Form 4952 line 4g). Absent: no. */
  electedInvestmentIncome?: boolean;
  /* The parent's tax was figured on Schedule J (farm or fishing income). Absent: no. */
  usedScheduleJ?: boolean;
  /* The parent files Form 2555. Absent: no. */
  filesForm2555?: boolean;
  /* Line 7: each other child whose Form 8615 uses this parent's return. Absent or empty: none. */
  otherChildren?: OtherChildForm8615[];
}

export const CHILD_UNEARNED_INCOME_KEYS = {
  /* Who Must File, condition 4: at least one of the child's parents was alive at the end of 2025 (boolean). */
  parentAlive: "child_unearned_income.parent_alive",
  /* Condition 3c: a full-time student at the end of 2025 (boolean). Asked only for a child aged 19 to 23. */
  fullTimeStudent: "child_unearned_income.full_time_student",
  /* Conditions 3b and 3c: earned income more than half of the child's support (boolean). Asked only for a child aged 18 to 23. */
  earnedIncomeOverHalfOfSupport: "child_unearned_income.earned_income_over_half_of_support",
  /* The parent's return: a ParentReturnFactValue. */
  parentReturn: "child_unearned_income.parent_return",
  /*
   * Someone can claim the child as a dependent (boolean). The rules apply
   * either way (::who-must-file::b01), but a dependent's standard deduction
   * comes from the Standard Deduction Worksheet for Dependents
   * (irs-1040-inst-2025::sec::line-16::b03), which changes line 4.
   */
  claimableAsDependent: "child_unearned_income.claimable_as_dependent",
  /*
   * Line 2, for a child who itemizes: the part of Schedule A line 17 directly
   * connected with producing the unearned income on line 1 (::line-2::b01), a number.
   */
  itemizedForUnearnedIncome: "child_unearned_income.itemized_for_unearned_income",
  /*
   * Line 5 Worksheets #2 and #3 line 5, for a child who itemizes: the itemized
   * deductions directly connected with producing the child's qualified
   * dividends and net capital gain (::line-8::b06, ::line-8::b08), a number.
   */
  itemizedForDividendsAndGains: "child_unearned_income.itemized_for_dividends_and_gains",
} as const;

type FactRow = { key: string; value: unknown; category: string };

const CHILD_UNEARNED_INCOME_CATEGORY = "other";

/* The parent's return fact, or undefined when it is missing or not an object with a name. */
export function readParentReturnFact(
  facts: ReadonlyArray<FactRow>,
): ParentReturnFactValue | undefined {
  const row = facts.find(
    (each) =>
      each.category === CHILD_UNEARNED_INCOME_CATEGORY &&
      each.key === CHILD_UNEARNED_INCOME_KEYS.parentReturn,
  );
  const value = row?.value as ParentReturnFactValue | undefined;
  return typeof value === "object" && value !== null && typeof value.name === "string"
    ? value
    : undefined;
}
