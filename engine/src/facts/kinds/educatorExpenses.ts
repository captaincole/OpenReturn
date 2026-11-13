/*
 * Schedule 1 line 11 answers: the qualified expenses an eligible educator paid in
 * the tax year, after reimbursements (irs-1040-inst-2025::sec::adjustments-to::b01).
 * An eligible educator is a K-12 teacher, instructor, counselor, principal or aide
 * who worked in a school for at least 900 hours during a school year. Cade records
 * the amount only for a person who meets that test. One key per spouse: neither
 * spouse can deduct more than $300.
 */

export const EDUCATOR_EXPENSE_KEYS = {
  taxpayer: "adjustments.educator_expenses.taxpayer",
  spouse: "adjustments.educator_expenses.spouse",
} as const;
