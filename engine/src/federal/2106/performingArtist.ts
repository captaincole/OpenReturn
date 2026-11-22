/*
 * The qualified performing artist tests (irs-2106-inst-2025::sec::line-10::b02, b03):
 * 1. services in the performing arts as an employee for at least two employers;
 * 2. wages of $200 or more from at least two of them;
 * 3. allowable performing-arts expenses of more than 10% of the gross income from
 *    the performing arts;
 * 4. AGI of $16,000 or less before deducting them (Schedule 1 line 12, which
 *    reads AGI; performingArtistAgiTest).
 * A married person files jointly unless the spouses lived apart all year; on a
 * joint return tests 1–3 are each spouse's own (one fact each) and test 4 is
 * the couple's.
 */

import type { EmployeeBusinessExpensesFactValue } from "../../facts/index.js";
import type { FilingStatus } from "../../values.js";

/* Tests 1 and 2: at least two employers, each paying $200 or more. */
export const MIN_PERFORMING_ARTS_EMPLOYERS = 2;
/* Test 3: expenses more than 10% of the performing-arts gross income. */
export const EXPENSES_SHARE_OF_GROSS_INCOME = 0.1;
/* Test 4: AGI of $16,000 or less before deducting the expenses. */
export const PERFORMING_ARTIST_AGI_LIMIT = 16_000;

const TESTS_MISSING =
  "A performing artist's fact does not state the employers paying $200 or more or the gross income from the performing arts (irs-2106-inst-2025::sec::line-10::b02).";

/* Tests 1–3 and the married rule: true, false, or a gap when an answer is missing. */
export function performingArtistTests(
  fact: EmployeeBusinessExpensesFactValue,
  expenses: number,
  filingStatus: FilingStatus | undefined,
): boolean | string {
  const employers = fact.performingArtsEmployersPaid200;
  const grossIncome = fact.performingArtsGrossIncome;
  if (employers === undefined || grossIncome === undefined) return TESTS_MISSING;
  if (filingStatus === "married_filing_separately" && fact.livedApartFromSpouseAllYear !== true) {
    return false;
  }
  return (
    employers >= MIN_PERFORMING_ARTS_EMPLOYERS &&
    expenses > EXPENSES_SHARE_OF_GROSS_INCOME * grossIncome
  );
}

/* Test 4: AGI before the performing-arts expenses is $16,000 or less. */
export function passesAgiTest(agiBeforeExpenses: number): boolean {
  return agiBeforeExpenses <= PERFORMING_ARTIST_AGI_LIMIT;
}
