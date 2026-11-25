/*
 * Income of a foreign account recorded in the account's currency, as its
 * statement prints it: the currency, each amount, and the date of each amount
 * when the statement prints one. The fact holds no exchange rate: the engine
 * looks each one up in its tables (currency/rates.ts) and converts the
 * amounts before any form reads them (incomeInDollars.ts). A fact with no
 * `foreignCurrency` is in U.S. dollars, as before.
 *
 * The rate each amount takes (incomeInDollars.ts):
 * - income (interest, dividends, the early withdrawal penalty): the rate of
 *   its day when the fact dates it, else the IRS yearly average for the tax
 *   year;
 * - tax withheld: the rate of the day withheld, so its date is required
 *   (irs-1116-inst-2025::sec::foreign-currency-conversion::b01);
 * - a sale: the rates on the settlement dates of the sale and of the purchase,
 *   both required (26 CFR 1.988-2(a)(2)(iv)).
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
 * amounts the statement dates. Every tax withheld must be dated in full; the
 * part of an income box with no date takes the yearly average.
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
