/*
 * A fund prints its amounts in its own currency: the year-end value, the
 * distributions and their tax, the proceeds of a sale. The fund fact holds
 * them that way, with the shareholder's U.S. dollar rate for each date. Form
 * 8621 asks for U.S. dollars on every line but lines 15a to 15e(1)
 * (irs-8621-inst-2025::sec::line-15::b01): "Each distribution is translated
 * into the U.S. dollar at the spot rate on the date on which such distribution
 * is made." The year-end value and a sale convert the same way, at the rate
 * of their date.
 */

import type { PficDisposition, PficFundFactValue } from "../../facts/index.js";
import { US_DOLLAR } from "./line15.js";

/* The fund's currency: USD when the fact names none. */
export const currencyOf = (fund: PficFundFactValue): string => fund.currencyCode ?? US_DOLLAR;

/* An amount in the fund's currency, in U.S. dollars at the given rate (cents kept). */
const inDollars = (amount: number, usdPerUnit: number | undefined) => amount * (usdPerUnit ?? 1);

/* Line 4, and line 10a for marked stock: the value at the end of the year in U.S. dollars. */
export const yearEndValueUsd = (fund: PficFundFactValue): number =>
  inDollars(fund.valueAtYearEnd, fund.yearEndUsdPerUnit);

/* A sale with its amount realized in U.S. dollars; the basis is already in dollars. */
export const saleInDollars = (sale: PficDisposition): PficDisposition => ({
  ...sale,
  amountRealized: inDollars(sale.amountRealized, sale.usdPerUnit),
});

/*
 * Why a fund's amounts cannot be put in U.S. dollars: a fund in another
 * currency with no rate for its year-end value or its sale. The distributions'
 * rates are checked with lines 15a to 15e (line15.ts).
 */
export function currencyGap(fund: PficFundFactValue): string | undefined {
  const currency = currencyOf(fund);
  if (currency === US_DOLLAR) return undefined;
  if (fund.valueAtYearEnd !== 0 && fund.yearEndUsdPerUnit === undefined)
    return `The fund's year-end value is in ${currency}, and the fact states no U.S. dollar rate for December 31 (line 4).`;
  if (fund.disposition !== undefined && fund.disposition.usdPerUnit === undefined)
    return `The sale proceeds are in ${currency}, and the fact states no U.S. dollar rate for the sale date (lines 13a and 15f).`;
  return undefined;
}
