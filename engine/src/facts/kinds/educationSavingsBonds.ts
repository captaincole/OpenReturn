/*
 * Form 8815 answers, the education savings bond exclusion. Two kinds of fact,
 * both in category "education":
 *
 * - a bond cashed: one series EE or I U.S. savings bond redeemed in 2025. The
 *   input is the written record the instructions require for each bond (serial
 *   number, issue date, face value, total redemption proceeds;
 *   irs-8815-form-2025::sec::recordkeeping-requirements::b01): Form 8818, or the
 *   redemption record from TreasuryDirect or the paying bank. The bond's
 *   interest is also on a Form 1099-INT, box 3 (the interest fact); this fact
 *   does not replace it.
 * - an education expense row: one person at one institution (Form 8815 line 1,
 *   columns (a) and (b)), with the expenses of lines 2 and 3 for that row.
 */

type FactRow = { key: string; value: unknown; category: string };

export type SavingsBondSeries = "EE" | "I";

/*
 * A paper series EE bond was sold at half of its face value; an electronic EE
 * bond (also a paper EE bond converted to electronic) and every series I bond
 * at face value (Line 6 Worksheet lines 2 and 4, irs-8815-form-2025::sec::line-6::b01).
 */
export type SavingsBondFormat = "paper" | "electronic";

export interface SavingsBondCashedFactValue {
  serialNumber?: string;
  series: SavingsBondSeries;
  format: SavingsBondFormat;
  /* The issue date, YYYY-MM-DD (the first day of the month the bond was bought). */
  issueDate: string;
  faceValue: number;
  /* Total redemption proceeds, principal and interest (Form 8815 line 5). */
  proceeds: number;
  /* Interest on this bond that the taxpayer reported as income before 2025 (Line 6 Worksheet line 7). */
  interestReportedInPriorYears?: number;
  /*
   * The ownership test (irs-8815-form-2025::sec::u-s-savings-bonds-that-qualify-for-exclusion::b01):
   * the bond is in the filer's name, or both spouses' names, and the owner was
   * age 24 or older before the issue date. A bond bought in a child's name fails it.
   */
  ownerQualifies: boolean;
}

export interface SavingsBondExpenseFactValue {
  /* Line 1 column (a): the taxpayer, the spouse or a dependent claimed on this return. */
  studentName: string;
  /* Line 1 column (b): the institution, or "Coverdell ESA" or "QTP" and the account's financial institution or program. */
  institutionName: string;
  institutionAddress: string;
  /*
   * Line 2: tuition and fees, and contributions to a Coverdell ESA or QTP, paid
   * in 2025 (irs-8815-form-2025::sec::line-2::b01). Already without the expenses
   * line 2 leaves out: room and board, hobby courses, expenses covered by
   * benefits paid directly to or by the institution, expenses used for an
   * education credit (Form 8863) or for a tax-free Coverdell ESA or QTP distribution.
   */
  qualifiedExpenses: number;
  /*
   * Line 3: the part of line 2 covered by nontaxable educational benefits not
   * paid directly to or by the institution (irs-8815-form-2025::sec::line-3::b01).
   */
  nontaxableBenefits?: number;
}

export interface SavingsBondCashedFact {
  key: string;
  value: SavingsBondCashedFactValue;
}

export interface SavingsBondExpenseFact {
  key: string;
  value: SavingsBondExpenseFactValue;
}

const EDUCATION_CATEGORY = "education";
const BOND_KEY_START = "education.savings_bond.";
const EXPENSE_KEY_START = "education.savings_bond_expense.";

export function makeSavingsBondCashedFactKey(bondSlug: string): string {
  return `${BOND_KEY_START}${bondSlug}`;
}

export function makeSavingsBondExpenseFactKey(rowSlug: string): string {
  return `${EXPENSE_KEY_START}${rowSlug}`;
}

const isOneSlugUnder = (key: string, start: string) =>
  key.startsWith(start) && key.split(".").length === 3;

export function isSavingsBondCashedFactKey(key: string): boolean {
  return isOneSlugUnder(key, BOND_KEY_START);
}

export function isSavingsBondExpenseFactKey(key: string): boolean {
  return isOneSlugUnder(key, EXPENSE_KEY_START);
}

/* Every bond cashed, in the order the facts arrive. */
export function getSavingsBondCashedFacts(facts: ReadonlyArray<FactRow>): SavingsBondCashedFact[] {
  return facts
    .filter((fact) => fact.category === EDUCATION_CATEGORY && isSavingsBondCashedFactKey(fact.key))
    .map((fact) => ({ key: fact.key, value: fact.value as SavingsBondCashedFactValue }));
}

/* Every line 1 row, in the order the facts arrive. */
export function getSavingsBondExpenseFacts(
  facts: ReadonlyArray<FactRow>,
): SavingsBondExpenseFact[] {
  return facts
    .filter((fact) => fact.category === EDUCATION_CATEGORY && isSavingsBondExpenseFactKey(fact.key))
    .map((fact) => ({ key: fact.key, value: fact.value as SavingsBondExpenseFactValue }));
}
