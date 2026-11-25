/*
 * The 23 currencies of the Federal Reserve Board's H.10 release, "Foreign
 * Exchange Rates", and where each one is published:
 * - the H.10 history pages (https://www.federalreserve.gov/releases/h10/hist/):
 *   one page for 2000 to the present (dat00_<page>.htm), one for 1990-99
 *   (dat96_), one through 1989 (dat89_);
 * - the IRS yearly average table, a row named by its Country column;
 * - the Treasury Reporting Rates of Exchange, a `country_currency_desc`.
 *
 * H.10 prints "currency units per U.S. dollar except as noted by an
 * asterisk"; the four with the asterisk print U.S. dollars per unit. The IRS
 * and the Treasury print units per dollar for every currency.
 */

export type Quote = "units_per_dollar" | "dollars_per_unit";

export interface CurrencySource {
  /* ISO 4217 code. */
  code: string;
  /* The H.10 history page's suffix: "eu" for dat00_eu.htm. */
  h10Page: string;
  /* How H.10 prints it. */
  quote: Quote;
  /*
   * The IRS table's Country column. Absent: the IRS table has no average for
   * the currency. It lists no Malaysia and no Sri Lanka, and its Venezuela row
   * is the "Bolivar (Fuerte)", not the unit of the H.10 and Treasury series.
   */
  irsCountry?: string;
  treasury: string;
  /*
   * The first day the H.10 series is in today's unit. Venezuela's series
   * changes unit with each redenomination (it jumps on 2018-08-20 and on
   * 2021-10-04) and the history pages do not restate the earlier rates.
   */
  firstDay?: string;
  /*
   * The Board's index links a page through 1989 that is not there (HTTP 404):
   * Brazil, Mexico and Venezuela (the euro began in 1999).
   */
  noPageBefore1990?: boolean;
}

const units = (
  code: string,
  h10Page: string,
  irsCountry: string | undefined,
  treasury: string,
): CurrencySource => ({ code, h10Page, irsCountry, quote: "units_per_dollar", treasury });

const dollars = (
  code: string,
  h10Page: string,
  irsCountry: string,
  treasury: string,
): CurrencySource => ({ code, h10Page, irsCountry, quote: "dollars_per_unit", treasury });

export const CURRENCY_SOURCES: CurrencySource[] = [
  dollars("AUD", "al", "Australia", "Australia-Dollar"),
  { ...units("BRL", "bz", "Brazil", "Brazil-Real"), noPageBefore1990: true },
  units("CAD", "ca", "Canada", "Canada-Dollar"),
  units("CNY", "ch", "China", "China-Renminbi"),
  units("DKK", "dn", "Denmark", "Denmark-Krone"),
  { ...dollars("EUR", "eu", "Euro Zone", "Euro Zone-Euro"), noPageBefore1990: true },
  units("HKD", "hk", "Hong Kong", "Hong Kong-Dollar"),
  units("INR", "in", "India", "India-Rupee"),
  units("JPY", "ja", "Japan", "Japan-Yen"),
  units("MYR", "ma", undefined, "Malaysia-Ringgit"),
  { ...units("MXN", "mx", "Mexico", "Mexico-Peso"), noPageBefore1990: true },
  dollars("NZD", "nz", "New Zealand", "New Zealand-Dollar"),
  units("NOK", "no", "Norway", "Norway-Krone"),
  units("SGD", "si", "Singapore", "Singapore-Dollar"),
  units("ZAR", "sf", "South Africa", "South Africa-Rand"),
  // The IRS table prints "South Korean".
  units("KRW", "ko", "South Korean", "Korea-Won"),
  units("LKR", "sl", undefined, "Sri Lanka-Rupee"),
  units("SEK", "sd", "Sweden", "Sweden-Krona"),
  units("CHF", "sz", "Switzerland", "Switzerland-Franc"),
  units("TWD", "ta", "Taiwan", "Taiwan-Dollar"),
  units("THB", "th", "Thailand", "Thailand-Baht"),
  dollars("GBP", "uk", "United Kingdom", "United Kingdom-Pound"),
  {
    ...units("VES", "ve", undefined, "Venezuela-Bolivar Soberano"),
    firstDay: "2021-10-04",
    noPageBefore1990: true,
  },
];

export const H10_HISTORY_BASE = "https://www.federalreserve.gov/releases/h10/hist/";

/*
 * The three history pages of a currency, newest first: the century of their
 * two-digit years, and the years each page owns. The 1990-99 Australian dollar
 * page also lists 2000 and 2001 (as years "00" and "01"); the page that owns a
 * year is the one read for it.
 */
export const H10_PAGE_SETS = [
  { prefix: "dat00_", century: 2000, years: [2000, 2099], before1990: false },
  { prefix: "dat96_", century: 1900, years: [1990, 1999], before1990: false },
  { prefix: "dat89_", century: 1900, years: [1900, 1989], before1990: true },
] as const;

export const IRS_YEARLY_AVERAGES =
  "https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates";

export const TREASURY_API =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange";
