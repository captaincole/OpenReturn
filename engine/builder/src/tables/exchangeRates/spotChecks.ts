/*
 * Values typed by hand from the published pages; a built table that does not
 * hold them is not written.
 * - H.10: the weekly release of November 23, 2026
 *   (https://www.federalreserve.gov/releases/h10/current/), the rates for
 *   November 20, 2026, and two old rows of the history pages.
 * - IRS: "Yearly average currency exchange rates", the 2025 column, read 2026-11-24
 *   (https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates).
 * - Treasury: the Reporting Rates of Exchange as of December 31, 2025.
 */

import type { AverageTable, DailyTable, YearEndTable } from "./buildTables.js";

const H10_NOVEMBER_20_2026: Record<string, string> = {
  AUD: "0.6639",
  BRL: "5.9488",
  CAD: "1.4323",
  CNY: "6.6770",
  DKK: "6.8066",
  EUR: "1.0981",
  HKD: "7.8370",
  INR: "92.6700",
  JPY: "158.7600",
  MXN: "19.0380",
  NZD: "0.5486",
  NOK: "9.7648",
  SGD: "1.2893",
  ZAR: "17.4750",
  KRW: "1342.4100",
  SEK: "10.2114",
  CHF: "0.8394",
  TWD: "32.9700",
  THB: "33.9300",
  GBP: "1.3104",
};

/* [code, ISO date, rate]: the first rows of two history pages. */
const H10_OLD_ROWS: Array<[string, string, string]> = [
  ["GBP", "1971-01-04", "2.3938"],
  ["EUR", "2000-01-03", "1.0155"],
];

/* The IRS table's 2025 column, for each of the 20. */
const IRS_2025: Record<string, string> = {
  AUD: "1.551",
  BRL: "5.593",
  CAD: "1.398",
  CNY: "7.129",
  DKK: "6.617",
  EUR: "0.886",
  HKD: "7.796",
  INR: "87.133",
  JPY: "149.632",
  MXN: "19.212",
  NZD: "1.719",
  NOK: "10.392",
  SGD: "1.307",
  ZAR: "17.884",
  KRW: "1421.779",
  SEK: "9.813",
  CHF: "0.831",
  TWD: "31.167",
  THB: "32.870",
  GBP: "0.759",
};

const TREASURY_2025: Record<string, string> = { EUR: "0.851", CHF: "0.792" };

const DAY_MS = 86_400_000;

/* The rate a daily table holds for an ISO date ("" for none). */
export function dailyEntry(table: DailyTable, code: string, isoDate: string): string {
  const year = isoDate.slice(0, 4);
  const entries = (table.currencies[code]?.years[year] ?? "").split(",");
  const day = (Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${year}-01-01T00:00:00Z`)) / DAY_MS;
  return entries[day] ?? "";
}

function failures(checks: Array<[string, string, string]>): string[] {
  return checks
    .filter(([, expected, got]) => expected !== got)
    .map(([what, expected, got]) => `${what}: expected ${expected}, got "${got}"`);
}

export function checkDaily(table: DailyTable): string[] {
  const november = Object.entries(H10_NOVEMBER_20_2026).map(
    ([code, rate]): [string, string, string] => [
      `H.10 ${code} 2026-11-20`,
      rate,
      dailyEntry(table, code, "2026-11-20"),
    ],
  );
  const old = H10_OLD_ROWS.map(([code, date, rate]): [string, string, string] => [
    `H.10 ${code} ${date}`,
    rate,
    dailyEntry(table, code, date),
  ]);
  return failures([...november, ...old]);
}

export function checkAverages(table: AverageTable): string[] {
  if (table.taxYear !== 2025) return [];
  return failures(
    Object.entries(IRS_2025).map(([code, rate]): [string, string, string] => [
      `IRS ${code} 2025`,
      rate,
      table.rates[code] ?? "",
    ]),
  );
}

export function checkYearEnd(table: YearEndTable): string[] {
  if (table.taxYear !== 2025) return [];
  return failures(
    Object.entries(TREASURY_2025).map(([code, rate]) => [
      `Treasury ${code} 2025-12-31`,
      rate,
      table.rates[code] ?? "",
    ]),
  );
}
