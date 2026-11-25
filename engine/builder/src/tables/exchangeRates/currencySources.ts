/*
 * The 23 currencies of the Federal Reserve Board's H.10 release, "Foreign
 * Exchange Rates", and where each one is published:
 * - the H.10 history pages (https://www.federalreserve.gov/releases/h10/hist/):
 *   one page for 2000 to the present (dat00_<page>.htm), one for 1990-99
 *   (dat96_), one through 1989 (dat89_);
 * - the G.5A annual release, a row named by its COUNTRY column;
 * - the Treasury Reporting Rates of Exchange, a `country_currency_desc`.
 *
 * H.10 and G.5A print "currency units per U.S. dollar except as noted by an
 * asterisk"; the four with the asterisk print U.S. dollars per unit.
 */

export type Quote = "units_per_dollar" | "dollars_per_unit";

export interface CurrencySource {
  /* ISO 4217 code. */
  code: string;
  /* The H.10 history page's suffix: "eu" for dat00_eu.htm. */
  h10Page: string;
  /* The G.5A COUNTRY column, without the asterisk. */
  g5aCountry: string;
  quote: Quote;
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
  g5aCountry: string,
  treasury: string,
): CurrencySource => ({ code, h10Page, g5aCountry, quote: "units_per_dollar", treasury });

const dollars = (
  code: string,
  h10Page: string,
  g5aCountry: string,
  treasury: string,
): CurrencySource => ({ code, h10Page, g5aCountry, quote: "dollars_per_unit", treasury });

export const CURRENCY_SOURCES: CurrencySource[] = [
  dollars("AUD", "al", "AUSTRALIA", "Australia-Dollar"),
  { ...units("BRL", "bz", "BRAZIL", "Brazil-Real"), noPageBefore1990: true },
  units("CAD", "ca", "CANADA", "Canada-Dollar"),
  units("CNY", "ch", "CHINA, P.R.", "China-Renminbi"),
  units("DKK", "dn", "DENMARK", "Denmark-Krone"),
  { ...dollars("EUR", "eu", "EMU MEMBERS", "Euro Zone-Euro"), noPageBefore1990: true },
  units("HKD", "hk", "HONG KONG", "Hong Kong-Dollar"),
  units("INR", "in", "INDIA", "India-Rupee"),
  units("JPY", "ja", "JAPAN", "Japan-Yen"),
  units("MYR", "ma", "MALAYSIA", "Malaysia-Ringgit"),
  { ...units("MXN", "mx", "MEXICO", "Mexico-Peso"), noPageBefore1990: true },
  dollars("NZD", "nz", "NEW ZEALAND", "New Zealand-Dollar"),
  units("NOK", "no", "NORWAY", "Norway-Krone"),
  units("SGD", "si", "SINGAPORE", "Singapore-Dollar"),
  units("ZAR", "sf", "SOUTH AFRICA", "South Africa-Rand"),
  units("KRW", "ko", "SOUTH KOREA", "Korea-Won"),
  units("LKR", "sl", "SRI LANKA", "Sri Lanka-Rupee"),
  units("SEK", "sd", "SWEDEN", "Sweden-Krona"),
  units("CHF", "sz", "SWITZERLAND", "Switzerland-Franc"),
  units("TWD", "ta", "TAIWAN", "Taiwan-Dollar"),
  units("THB", "th", "THAILAND", "Thailand-Baht"),
  dollars("GBP", "uk", "UNITED KINGDOM", "United Kingdom-Pound"),
  {
    ...units("VES", "ve", "VENEZUELA", "Venezuela-Bolivar Soberano"),
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

export const G5A_BASE = "https://www.federalreserve.gov/releases/g5a/";

export const TREASURY_API =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange";
