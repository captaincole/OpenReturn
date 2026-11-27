/*
 * Federal estimated tax for 2025: the payments (Form 1040 line 26), the
 * payment with an extension (Schedule 3 line 10) and the answers Form 2210
 * needs to figure the underpayment penalty. Each is an
 * answer the taxpayer states, category estimated_payments. Cade records a
 * payment only when the taxpayer made it.
 *
 * A date is "YYYY-MM-DD": the U.S. postmark for a mailed payment, else the day
 * it was paid (irs-2210-inst-2025::sec::table-1-estimated-tax-payments::b02).
 */

type FactRow = { key: string; value: unknown; category: string };

const ESTIMATED_TAX_CATEGORY = "estimated_payments";
const PAYMENT_PREFIX = "estimated_tax.payment.";
const DATED_WITHHOLDING_PREFIX = "estimated_tax_penalty.withholding_on.";
const PERIOD_PREFIX = "estimated_tax_penalty.annualized_period.";

export const ESTIMATED_TAX_KEYS = {
  /*
   * The 2024 overpayment applied to 2025 estimated tax, a number. Form 2210
   * treats it as paid on April 15, 2025 (irs-2210-inst-2025::sec::line-11::b01).
   */
  priorYearOverpaymentApplied: "estimated_tax.prior_year_overpayment_applied",
  /*
   * Schedule 3 line 10: the total paid with Form 4868, by an electronic
   * payment made to get the automatic extension, or with Form 2350, a number
   * in dollars. The fee of a card or electronic payment is not part of it
   * (irs-1040-inst-2025::sec::line-10-4::b01). Recorded only when the taxpayer
   * made such a payment.
   */
  extensionPayment: "estimated_tax.extension_payment",
  /*
   * Form 2210 Part II box A or B: "entire" or "part", recorded only when the
   * taxpayer asks for a waiver (retired after age 62 or disabled in 2024 or
   * 2025, or a casualty, disaster or other unusual circumstance;
   * irs-2210-inst-2025::sec::waiver-of-penalty::b01). A farmer or fisher's
   * request is Form 2210-F box A, either way
   * (irs-2210f-inst-2025::sec::waiver-of-penalty::b01).
   */
  waiverRequest: "estimated_tax_penalty.waiver_request",
  /*
   * Box B: the part of the penalty to waive, a number (the dotted line next to
   * line 19; on Form 2210-F, the dotted line next to line 16).
   */
  waiverAmount: "estimated_tax_penalty.waiver_amount",
} as const;

/* A dated amount: an estimated tax payment, or federal income tax withheld on that day. */
export interface DatedAmountFactValue {
  date: string;
  amount: number;
}

export interface DatedAmountFact {
  key: string;
  value: DatedAmountFactValue;
}

export type WaiverRequest = "entire" | "part";

/*
 * Schedule AI, one period: amounts from January 1 through the period's last
 * day, as the taxpayer's method of accounting counts them
 * (irs-2210-inst-2025::sec::schedule-ai-annualized-income::b01–b02). Column (d)
 * is the whole year, so it comes from the return. An amount left out is none.
 */
export interface AnnualizedPeriodFactValue {
  /* Line 1: total income minus adjustments, the deductible part of SE tax taken into account. */
  adjustedGrossIncome: number;
  /* Line 4: itemized deductions paid in the period (read only when the return itemizes). */
  itemizedDeductions?: number;
  /* Line 9: the deduction for qualified business income for the period. */
  qbiDeduction?: number;
  /* The period's qualified dividends and net capital gain, for the line 14 tax. */
  qualifiedDividends?: number;
  netCapitalGain?: number;
  /* Line 16: other taxes owed because of events in the period (AMT, NIIT, Additional Medicare Tax, …). */
  otherTaxes?: number;
  /* Line 18: the credits of Part I lines 1 and 3 earned in the period, figured on annualized items. */
  credits?: number;
  /* Line 28: net profit from all trades or businesses in the period (before the 92.35%). */
  selfEmploymentProfit?: number;
  /* Line 30: wages in the period subject to social security tax. */
  socialSecurityWages?: number;
}

/* Schedule AI columns (a)–(c); column (d) is the year on the return. */
export const ANNUALIZED_PERIODS = ["a", "b", "c"] as const;
export type AnnualizedPeriod = (typeof ANNUALIZED_PERIODS)[number];

export function makeEstimatedTaxPaymentFactKey(paymentSlug: string): string {
  return `${PAYMENT_PREFIX}${paymentSlug}`;
}

/* Box D: withholding on the dates it was actually withheld, one fact per date. */
export function makeDatedWithholdingFactKey(slug: string): string {
  return `${DATED_WITHHOLDING_PREFIX}${slug}`;
}

export function makeAnnualizedPeriodFactKey(period: AnnualizedPeriod): string {
  return `${PERIOD_PREFIX}${period}`;
}

function hasPrefix(key: string, prefix: string): boolean {
  return key.startsWith(prefix) && key.length > prefix.length;
}

function datedFacts(facts: ReadonlyArray<FactRow>, prefix: string): DatedAmountFact[] {
  return facts
    .filter((row) => row.category === ESTIMATED_TAX_CATEGORY && hasPrefix(row.key, prefix))
    .map((row) => ({ key: row.key, value: row.value as DatedAmountFactValue }));
}

/* Every 2025 estimated tax payment, in the order recorded. */
export function getEstimatedTaxPaymentFacts(facts: ReadonlyArray<FactRow>): DatedAmountFact[] {
  return datedFacts(facts, PAYMENT_PREFIX);
}

export function getDatedWithholdingFacts(facts: ReadonlyArray<FactRow>): DatedAmountFact[] {
  return datedFacts(facts, DATED_WITHHOLDING_PREFIX);
}

export function isWaiverRequest(value: unknown): value is WaiverRequest {
  return value === "entire" || value === "part";
}
