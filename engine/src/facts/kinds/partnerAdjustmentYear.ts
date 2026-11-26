/*
 * The partner's answers for one earlier tax year that the Forms 8986
 * (partnershipAdjustment.ts) change: one column of Form 8978. One fact per
 * tax year, category k1. The year is a first affected year (it holds the end
 * of a reviewed year) or an intervening year whose partner-level tax
 * attributes changed (irs-8978-inst-2025::sec::purpose-of-this-form::b05, b06).
 *
 * The engine does not read the earlier return (#79) and has no tax tables for
 * earlier years, so the partner states the earlier return's totals and the
 * corrected tax from the separate statement the instructions require
 * (irs-8978-inst-2025::sec::completing-form-8978-and-schedule-a::b01, b02).
 */

type FactRow = { key: string; value: unknown; category: string };

/* Which Form 8978 a column belongs to: the "BBA Audit" box or the "AAR Filing" box. */
export type PartnerAdjustmentSource = "bba_audit" | "aar";

/* The Schedule A (Form 8978) part an amount goes in: line 1 income, line 3 deductions, line 5 credits. */
export type ScheduleALine = "income" | "deductions" | "credits";

/*
 * A related amount that is not on a Form 8986 and comes from a change to a
 * partner-level tax attribute: a capital loss limit, a released passive loss,
 * an at-risk change, an inconsistent position taken earlier
 * (irs-8978-inst-2025::sec::line-1-income-enter-all-the-adjustments-individually-from::b01,
 * ::inconsistent-positions::b01). Signed, as Schedule A prints it.
 */
export interface PartnerAttributeAdjustment {
  source: PartnerAdjustmentSource;
  line: ScheduleALine;
  /* The description used on the partner's return. */
  description: string;
  amount: number;
}

/*
 * The separate statement for one source in this year: how the corrected tax
 * was figured (irs-8978-inst-2025::sec::line-6-income-tax-include-a-separate-statement-showing::b01,
 * ::line-7-alternative-minimum-tax-amt-if-amt-applies::b01).
 */
export interface PartnerCorrectedYear {
  /* Line 6: the corrected income tax. */
  incomeTax: number;
  /* Line 7: the corrected alternative minimum tax; absent: no AMT. */
  alternativeMinimumTax?: number;
  /* Line 5, only when changes in tax attributes make it differ from line 2 less line 4. */
  taxableIncome?: number;
  /* Line 11, only when changes not on a line of the form make it differ from line 8 less line 10. */
  taxLiability?: number;
  /*
   * Line 15: the penalties figured on the penalty statement, for a year whose
   * Form 8986 lists an applicable penalty (irs-8978-inst-2025::sec::line-15::b01).
   * 0 when the statement shows none is due.
   */
  penalties?: number;
}

export interface PartnerAdjustmentYearFactValue {
  /* The partner's tax year (a calendar year before 2025). */
  taxYear: number;
  /*
   * As shown on the original or amended return, or as adjusted by the IRS:
   * line 1a total income, line 3a total deductions, line 9a total credits,
   * line 12 total income tax (irs-8978-inst-2025::sec::line-1a-total-income-per-original-return-or-as::b01,
   * ::line-3a-total-deductions-per-return-or-as-previously::b01,
   * ::line-9a-total-credits-per-return-or-as-previously::b01,
   * ::line-12-total-tax-shown-on-return-or-as-previously::b01). On a Form 1040
   * these are line 9, lines 10 and 14 added, line 21, and line 22 (QUESTIONS.md).
   */
  totalIncome: number;
  totalDeductions: number;
  totalCredits: number;
  totalIncomeTax: number;
  /*
   * The year's return was filed on a valid extension. Interest on a penalty
   * runs from the extended due date (irs-8978-inst-2025::sec::line-17::b01).
   * Asked only when line 15 has a penalty above 0.
   */
  returnExtended?: boolean;
  /* The Schedule A amounts that are not on a Form 8986, in the order entered. */
  attributeAdjustments?: PartnerAttributeAdjustment[];
  /* The statement for the audit's Form 8978; the AAR's. */
  bbaAudit?: PartnerCorrectedYear;
  aar?: PartnerCorrectedYear;
}

export interface PartnerAdjustmentYearFact {
  key: string;
  value: PartnerAdjustmentYearFactValue;
}

const YEAR_CATEGORY = "k1";
const YEAR_PREFIX = "form_8978_year.";

export function makePartnerAdjustmentYearFactKey(taxYear: number): string {
  return `${YEAR_PREFIX}${taxYear}`;
}

export function isPartnerAdjustmentYearFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === YEAR_PREFIX && parts[1] !== "";
}

/* Every year fact, in the order recorded. */
export function getPartnerAdjustmentYearFacts(
  facts: ReadonlyArray<FactRow>,
): PartnerAdjustmentYearFact[] {
  return facts
    .filter((row) => row.category === YEAR_CATEGORY && isPartnerAdjustmentYearFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as PartnerAdjustmentYearFactValue }));
}
