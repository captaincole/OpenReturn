/*
 * Form 1098-E, Student Loan Interest Statement: one fact per lender, and the
 * answer the Schedule 1 line 21 deduction also needs. The deduction applies only
 * when "You, or your spouse if filing jointly, aren't claimed as a dependent on
 * someone else's ... 2025 tax return" (irs-1040-inst-2025::sec::line-21::b01).
 * Cade records the form only for interest on a qualified student loan: a loan
 * taken out for the education of the taxpayer, the spouse or a dependent
 * (irs-1040-inst-2025::sec::line-21::b02).
 */

export interface StudentLoanInterestFactValue {
  lenderName: string;
  /* Box 1: student loan interest received by the lender in the year. */
  box1: number;
  /*
   * Box 2: checked when box 1 leaves out loan origination fees or capitalized
   * interest on loans made before September 1, 2004 (Pub. 970 figures those).
   */
  box2?: boolean;
}

export const STUDENT_LOAN_KEYS = {
  /* Line 21: the taxpayer, or the spouse on a joint return, is claimed as a dependent on another person's 2025 return. */
  claimedAsDependent: "student_loan.claimed_as_dependent",
} as const;

const STUDENT_LOAN_CATEGORY = "education";
const KEY_PREFIX = "lender.";
const KEY_SUFFIX = ".student_loan_interest";

export function makeStudentLoanInterestFactKey(lenderSlug: string): string {
  return `${KEY_PREFIX}${lenderSlug}${KEY_SUFFIX}`;
}

export function isStudentLoanInterestFactKey(key: string): boolean {
  const slug = key.slice(KEY_PREFIX.length, key.length - KEY_SUFFIX.length);
  return (
    key.startsWith(KEY_PREFIX) && key.endsWith(KEY_SUFFIX) && slug !== "" && !slug.includes(".")
  );
}

/* Every Form 1098-E among the fact rows, in the order recorded. */
export function studentLoanInterestForms(
  rows: readonly { key: string; value: unknown; category: string }[],
): StudentLoanInterestFactValue[] {
  return rows
    .filter((row) => row.category === STUDENT_LOAN_CATEGORY)
    .filter((row) => isStudentLoanInterestFactKey(row.key))
    .map((row) => row.value as StudentLoanInterestFactValue);
}
