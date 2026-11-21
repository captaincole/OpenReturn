/*
 * FTB 3506 answers (California child and dependent care expenses credit) that
 * the federal Form 2441 facts (dependentCare.ts) do not hold. The care
 * provider and qualifying person facts are shared; these are the answers only
 * the California form asks.
 */

/*
 * The Worksheet – Credit for 2024 Expenses Paid in 2025, lines 1, 4, 5, 7, 9,
 * 11 and 14: amounts from the 2024 California return.
 */
export interface CaPriorYearDependentCareFactValue {
  /* Line 1: 2024 qualified expenses paid in 2024, care in California. */
  expensesPaidIn2024: number;
  /* Line 4: qualifying persons in 2024 ($3,000 for one, $6,000 for two or more). */
  qualifyingPersons: number;
  /* Line 5: 2024 FTB 3506 Part IV line 26, benefits excluded from income. */
  excludedBenefits: number;
  /* Line 7: each spouse's 2024 earned income (spouse only on a joint return). */
  yourEarnedIncome: number;
  spouseEarnedIncome?: number;
  /* Line 9: 2024 FTB 3506 Side 1 Part III line 6. */
  priorYearLine6: number;
  /* Line 11: 2024 federal AGI (2024 Form 540 line 13). */
  federalAgi: number;
  /* Line 14: 2024 California AGI (the worksheet's line 14 reads the line 9 chart with it). */
  californiaAgi: number;
}

/* FTB 3506 Part I: one source of money that supported the household and is not earned income. */
export interface CaHouseholdFundsEntry {
  source: string;
  amount: number;
}

export const CA_DEPENDENT_CARE_KEYS = {
  /*
   * FTB 3506 worksheet line 2: 2024 qualified expenses for care in California
   * paid in 2025. 0 when none. Not asked when the federal answer
   * (dependent_care.prior_year_expenses_paid) is 0.
   */
  priorYearExpensesPaid: "dependent_care.ca_prior_year_expenses_paid",
  /* The worksheet's other lines (CaPriorYearDependentCareFactValue). */
  priorYearWorksheet: "dependent_care.ca_prior_year_worksheet",
  /*
   * FTB 3506 Part I: the household money that is not on the return (child
   * support, property settlements, public assistance, court awards,
   * inheritances, insurance proceeds, workers' compensation), as
   * CaHouseholdFundsEntry[]; an empty list when none. The return's own
   * interest, dividends, pensions, social security and unemployment are not repeated here.
   */
  householdFunds: "dependent_care.ca_household_funds",
} as const;
