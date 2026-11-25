/*
 * Income of a foreign account recorded in the account's currency, as its
 * statement prints it: the currency, each amount, and the date of each amount
 * where the rule needs one. The fact holds no exchange rate: the engine looks
 * each one up in its tables (currency/rates.ts) and converts the amounts
 * before any form reads them (incomeInDollars.ts). A fact with no
 * `foreignCurrency` is in U.S. dollars, as before.
 *
 * The rate each amount takes (incomeInDollars.ts):
 * - interest that accrues through the year: the return's method
 *   (FOREIGN_INCOME_RATE_METHOD_KEY), the yearly average or the rate of the
 *   day each amount was credited;
 * - each dividend: the rate of the day it was paid;
 * - foreign tax withheld: the rate of the day it was withheld
 *   (irs-1116-inst-2025::sec::foreign-currency-conversion::b01);
 * - a sale: the rates on the settlement dates of the sale and of the purchase
 *   (26 CFR 1.988-2(a)(2)(iv)).
 * A currency outside the engine's list (currency/currencies.ts) is unsupported.
 */

/* The boxes of a fact value that hold an amount. */
export type AmountBox<Value> = {
  [Key in keyof Value]-?: NonNullable<Value[Key]> extends number ? Key : never;
}[keyof Value] &
  string;

/* One day's amounts, as the statement lists them, by box: { box1a: 12880, box7: 1932 }. */
export interface DatedAmounts<Box extends string = string> {
  /* "MM/DD/YYYY". */
  date: string;
  amounts: Partial<Record<Box, number>>;
}

/*
 * A 1099-INT or 1099-DIV fact in a foreign currency. `byDate` lists the
 * amounts that take the rate of their day, adding up to each such box: every
 * dividend box; the interest boxes that are events (the early withdrawal
 * penalty, tax withheld); and, under the daily method, the interest credited.
 */
export interface IncomeInForeignCurrency<Box extends string = string> {
  /* ISO 4217: "EUR". */
  code: string;
  byDate?: DatedAmounts<Box>[];
}

/*
 * A sale's proceeds and cost in a foreign currency. The trade fact's own dates
 * stay the trade dates, which set the holding period
 * (irs-pub-550-2025::sec::holding-period::b03); the settlement dates set the
 * rates: "the amount realized ... at the spot rate on the settlement date of
 * the sale", and the basis "at the spot rate on the settlement date of the
 * purchase" (26 CFR 1.988-2(a)(2)(iv)(A), (B)). A basis the taxpayer states
 * (the reported-basis fact) and an adjustment amount are in U.S. dollars.
 */
export interface SaleInForeignCurrency {
  code: string;
  /* "MM/DD/YYYY". */
  saleSettled?: string;
  purchaseSettled?: string;
}

/*
 * The rate method for foreign interest that accrues through the year, one for
 * the return: "yearly_average" (the Board's G.5A average for the tax year) or
 * "daily" (the H.10 rate of each day an amount is credited, from `byDate`).
 * With no decision the engine takes the yearly average, as it takes the
 * default of the other elections it reads.
 */
export const FOREIGN_INCOME_RATE_METHOD_KEY = "decisions.foreign_income_rate_method";
export const FOREIGN_INCOME_RATE_METHODS = ["yearly_average", "daily"] as const;
export type ForeignIncomeRateMethod = (typeof FOREIGN_INCOME_RATE_METHODS)[number];
