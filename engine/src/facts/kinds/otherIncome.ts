/* Schedule 1 answers: income a taxpayer states with no document and no fact kind of its own. */

export const OTHER_INCOME_KEYS = {
  /* Line 8g: Alaska Permanent Fund dividends (every resident gets the same amount). */
  alaskaPermanentFundDividends: "other_income.alaska_permanent_fund_dividends",
  /* Line 2a: alimony received (a number). */
  alimonyReceived: "other_income.alimony_received",
  /* Line 2b: the date of the original divorce or separation agreement, YYYY-MM-DD. */
  alimonyReceivedAgreementDate: "other_income.alimony_received_agreement_date",
  /* Line 8h: jury duty pay (a number). */
  juryDutyPay: "other_income.jury_duty_pay",
  /* Line 8i: prizes and awards (a number). */
  prizesAndAwards: "other_income.prizes_and_awards",
  /* Line 8k: income from exercising stock options not on a W-2 (a number). */
  stockOptions: "other_income.stock_options",
  /* Line 8z: other taxable income, a list of { description, amount }. */
  otherItems: "other_income.other_items",
} as const;

/* One line 8z entry: the type of income as the taxpayer names it, and the amount. */
export interface OtherIncomeItem {
  description: string;
  amount: number;
}

/* The line 8z list, or undefined when it is absent or not a list of entries with amounts. */
export function readOtherIncomeItems(value: unknown): OtherIncomeItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const wellFormed = value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as Record<string, unknown>).description === "string" &&
      typeof (entry as Record<string, unknown>).amount === "number" &&
      Number.isFinite((entry as Record<string, unknown>).amount),
  );
  return wellFormed ? (value as OtherIncomeItem[]) : undefined;
}
