/* Schedule 1 answers: income a taxpayer states with no document and no fact kind of its own. */

export const OTHER_INCOME_KEYS = {
  /* Line 8g: Alaska Permanent Fund dividends (every resident gets the same amount). */
  alaskaPermanentFundDividends: "other_income.alaska_permanent_fund_dividends",
  /* Line 2a: alimony received (a number). */
  alimonyReceived: "other_income.alimony_received",
  /* Line 2b: the date of the original divorce or separation agreement, YYYY-MM-DD. */
  alimonyReceivedAgreementDate: "other_income.alimony_received_agreement_date",
  /* A pre-2019 agreement changed after 2018 to say alimony is not income (boolean). */
  alimonyReceivedAgreementExcludes: "other_income.alimony_received_agreement_excludes",
  /* Line 8h: jury duty pay (a number). */
  juryDutyPay: "other_income.jury_duty_pay",
  /* Line 8i: prizes and awards (a number). */
  prizesAndAwards: "other_income.prizes_and_awards",
  /* Line 8k: income from exercising stock options not on a W-2 (a number). */
  stockOptions: "other_income.stock_options",
  /* Line 8z: other taxable income, a list of { description, amount, treatyExempt? }. */
  otherItems: "other_income.other_items",
} as const;

/* One line 8z entry: the type of income as the taxpayer names it, and the amount. */
export interface OtherIncomeItem {
  description: string;
  amount: number;
  /*
   * True only for income a U.S. tax treaty exempts, entered below 0 ("in
   * parentheses, on Schedule 1 (Form 1040), line 8z",
   * irs-pub-519-2025::sec::general-rule-for-resident-aliens::b02). Absent on
   * every other item: the sign of an amount does not say what the item is.
   */
  treatyExempt?: true;
}

/* An entry with a description, a finite amount, and no mark or a true or false mark. */
function isOtherIncomeEntry(entry: unknown): entry is Record<string, unknown> {
  if (typeof entry !== "object" || entry === null) return false;
  const record = entry as Record<string, unknown>;
  const mark = record.treatyExempt;
  return (
    typeof record.description === "string" &&
    typeof record.amount === "number" &&
    Number.isFinite(record.amount) &&
    (mark === undefined || typeof mark === "boolean")
  );
}

/*
 * The line 8z list, or undefined when it is absent or not a list of entries
 * with amounts. A mark of false reads as no mark.
 */
export function readOtherIncomeItems(value: unknown): OtherIncomeItem[] | undefined {
  if (!Array.isArray(value) || !value.every(isOtherIncomeEntry)) return undefined;
  return value.map((entry) => ({
    description: entry.description as string,
    amount: entry.amount as number,
    ...(entry.treatyExempt === true ? { treatyExempt: true as const } : {}),
  }));
}
