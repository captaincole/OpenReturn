/*
 * Form 4952 answers: the amounts the taxpayer states (a brokerage statement
 * shows the margin interest; last year's Form 4952 line 7 the carryover).
 * The income side (lines 4a–4f) comes from the interest, dividend and trade facts.
 */

export const INVESTMENT_INTEREST_KEYS = {
  /* Line 1: investment interest expense paid or accrued this year. */
  expensePaid: "investment_interest.expense_paid",
  /* Line 2: disallowed investment interest expense carried over from last year's line 7. */
  disallowedCarryover: "investment_interest.disallowed_carryover",
  /* Line 4g: qualified dividends and net capital gain elected as investment income. */
  electedQualifiedDividendsAndGain: "investment_interest.elected_qualified_dividends_and_gain",
  /*
   * Line 5: allowed deductions directly connected with investment income, other
   * than interest (depreciation, depletion, investment expenses from a K-1 that
   * the return deducts). Not advisory, custodial or management fees: those are
   * miscellaneous itemized deductions, not allowed for 2025 (Form 4952, Line 5).
   */
  investmentExpenses: "investment_interest.investment_expenses",
  /* FTB 3526 line 2: last year's FTB 3526 line 7, California's own carryover (it differs from the federal one). */
  caDisallowedCarryover: "investment_interest.ca_disallowed_carryover",
  /*
   * Schedule P (540) line 7: last year's AMT FTB 3526 line 7, the carryover the
   * AMT refiguring of the form starts from (the same as the regular one when no
   * AMT form was filed last year).
   */
  caAmtDisallowedCarryover: "investment_interest.ca_amt_disallowed_carryover",
  /* FTB 3526 line 4e: a separate California election of net capital gain as investment income. */
  caElectedNetCapitalGain: "investment_interest.ca_elected_net_capital_gain",
} as const;
