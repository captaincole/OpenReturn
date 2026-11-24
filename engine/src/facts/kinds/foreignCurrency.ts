/*
 * The income of a foreign account, recorded in the account's currency as its
 * statement prints it, with the rates the taxpayer used. The engine holds no
 * rate table: each amount takes the rate on its fact, and incomeInDollars.ts
 * converts it before any form reads it. A fact with no `conversion` is in U.S.
 * dollars, as before.
 *
 * A rate is units of the currency per one U.S. dollar, as the Treasury and the
 * IRS print them: dollars = amount / rate (irs.gov "Yearly average currency
 * exchange rates": "divide the foreign currency amount by the applicable
 * yearly average exchange rate").
 */

/*
 * An interest (1099-INT) or dividend (1099-DIV) fact's amounts in a foreign
 * currency. Two rates, because the rules differ:
 * - the income and the other boxes: "Use the exchange rate prevailing when you
 *   receive, pay, or accrue the item" (irs.gov "Foreign currency and currency
 *   exchange rates"); the IRS "accepts any posted exchange rate that is used
 *   consistently" and publishes yearly averages (irs.gov "Yearly average
 *   currency exchange rates"). Which of the two a taxpayer may use is not
 *   settled (federal/8938/QUESTIONS.md, question 15): the fact names its rate.
 * - the foreign tax (1099-INT box 6, 1099-DIV box 7): "If you take a credit for
 *   taxes paid, the conversion rate is the rate of exchange in effect on the
 *   day you paid the foreign taxes (or on the day the tax was withheld)"; for
 *   taxes accrued, "generally ... the average exchange rate for the tax year to
 *   which the taxes relate" (irs-1116-inst-2025::sec::foreign-currency-conversion::b01;
 *   irs-pub-514-2025::sec::internal-revenue-service::b01).
 * A rate that is missing for an amount on the fact makes the fact wait.
 */
export interface IncomeCurrencyConversion {
  /* The currency the amounts are in: "Euro (EUR)". */
  currency: string;
  /* For every amount but the foreign tax. */
  exchangeRate?: number;
  /* Where the rate comes from: "IRS yearly average currency exchange rates, 2025". */
  rateSource?: string;
  /* For the foreign tax box only. */
  taxExchangeRate?: number;
  taxRateSource?: string;
}

/*
 * A sale's proceeds and cost in a foreign currency. For stock traded on an
 * established securities market and a cash-basis taxpayer: "the amount
 * realized ... shall be computed by translating the units of nonfunctional
 * currency received into functional currency at the spot rate on the
 * settlement date of the sale", and the basis "at the spot rate on the
 * settlement date of the purchase" (26 CFR 1.988-2(a)(2)(iv)(A), (B)). The
 * dates on the trade fact stay the trade dates, which set the holding period
 * (irs-pub-550-2025::sec::holding-period::b03). A basis the taxpayer states
 * (the reported-basis fact) and an adjustment amount are in U.S. dollars.
 */
export interface SaleCurrencyConversion {
  currency: string;
  /* The proceeds: the rate on the settlement date of the sale. */
  saleExchangeRate?: number;
  /* The cost: the rate on the settlement date of the purchase. */
  purchaseExchangeRate?: number;
  rateSource?: string;
}
