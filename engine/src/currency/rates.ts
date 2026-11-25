/*
 * The engine's exchange-rate tables, built by the builder's
 * `ingest-exchange-rates` command from the official pages and committed in
 * data/exchange-rates/ (each file names its source pages and the day of
 * download). The engine only reads them.
 * - dailyRate: the Federal Reserve Board's H.10 noon buying rate of a day.
 * - yearlyAverageRate: the Board's G.5A annual average of those rates.
 * - yearEndRate: the Treasury Reporting Rate of Exchange on December 31 of a
 *   tax year, the rate the Form 8938 instructions name
 *   (irs-8938-inst-2025::sec::foreign-currency-conversion::b01).
 * Every rate comes out as UnitsPerDollar (money.ts): H.10 and G.5A print four
 * currencies the other way (U.S. dollars for one unit), and the tables turn
 * them around here, the one place that knows how each is printed.
 */

import g5aAverages from "../data/exchange-rates/g5a-yearly-averages.json" with { type: "json" };
import h10Daily from "../data/exchange-rates/h10-daily.json" with { type: "json" };
import treasury2025 from "../data/exchange-rates/treasury-year-end-2025.json" with { type: "json" };
import type { UnitsPerDollar } from "../money.js";
import { unsupportedCurrencyReason } from "./currencies.js";

type Quote = "units_per_dollar" | "dollars_per_unit";

interface DailyCurrency {
  quote: Quote;
  firstDay: string;
  lastDay: string;
  /* One string per year: the rate of each calendar day from January 1, comma-separated; empty for none. */
  years: Record<string, string>;
}

const DAILY = h10Daily as unknown as { currencies: Record<string, DailyCurrency> };
const AVERAGES = g5aAverages as unknown as {
  quotes: Record<string, Quote>;
  years: Record<string, Record<string, string>>;
};
const YEAR_END: Record<number, { recordDate: string; rates: Record<string, string> }> = {
  2025: treasury2025,
};

export interface FoundRate {
  ok: true;
  rate: UnitsPerDollar;
  /* The rate as the source prints it: "1.1736", "0.851". */
  printed: string;
  /* The day the rate is for ("2025-05-22"), or the year of an average ("2025"). */
  day: string;
  source: string;
}

export type RateLookup = FoundRate | { ok: false; gap: string };

const gap = (reason: string): RateLookup => ({ ok: false, gap: reason });

function unitsPerDollar(printed: string, quote: Quote): UnitsPerDollar {
  const value = Number(printed);
  return (quote === "units_per_dollar" ? value : 1 / value) as UnitsPerDollar;
}

const DAY_MS = 86_400_000;
const timeOf = (isoDay: string) => Date.parse(`${isoDay}T00:00:00Z`);
const isoOf = (time: number) => new Date(time).toISOString().slice(0, 10);

const entriesCache = new Map<string, string[]>();

/* The printed rate of one day, or "" for a day with none. */
function entryOf(code: string, currency: DailyCurrency, isoDay: string): string {
  const year = isoDay.slice(0, 4);
  const cacheKey = `${code}:${year}`;
  let entries = entriesCache.get(cacheKey);
  if (entries === undefined) {
    entries = (currency.years[year] ?? "").split(",");
    entriesCache.set(cacheKey, entries);
  }
  return entries[(timeOf(isoDay) - timeOf(`${year}-01-01`)) / DAY_MS] ?? "";
}

/*
 * DECISION (2026-11-24): the source of daily rates is the Federal Reserve
 * Board's H.10 release, and only its 23 currencies are supported. Text: "The
 * Internal Revenue Service has no official exchange rate. Generally, it
 * accepts any posted exchange rate that is used consistently" (irs.gov
 * "Yearly average currency exchange rates"); it names no source. The engine
 * follows H.10, because one public source from a U.S. authority makes every
 * return repeatable.
 *
 * DECISION (2026-11-24): a day with no published rate (a weekend, a U.S.
 * holiday, "ND") takes the last earlier day that has one. No IRS text states
 * a rule; this is the engine's convention.
 *
 * The H.10 rate of a day ("2025-05-22").
 */
export function dailyRate(code: string, isoDay: string): RateLookup {
  const currency = DAILY.currencies[code];
  if (currency === undefined) return gap(unsupportedCurrencyReason(code));
  if (isoDay < currency.firstDay) {
    return gap(
      `The H.10 release has no ${code} rate on or before ${isoDay}: its table starts on ${currency.firstDay}.`,
    );
  }
  if (isoDay > currency.lastDay) {
    return gap(
      `The engine's H.10 table ends on ${currency.lastDay}, before ${isoDay}: it needs a refresh (npm run form-engine -- ingest-exchange-rates).`,
    );
  }
  for (let time = timeOf(isoDay); time >= timeOf(currency.firstDay); time -= DAY_MS) {
    const day = isoOf(time);
    const printed = entryOf(code, currency, day);
    if (printed !== "") {
      const rate = unitsPerDollar(printed, currency.quote);
      return { ok: true, rate, printed, day, source: `Federal Reserve H.10, ${day}` };
    }
  }
  return gap(`The H.10 release has no ${code} rate on or before ${isoDay}.`);
}

/* The G.5A average of a year's daily H.10 rates. */
export function yearlyAverageRate(code: string, year: number): RateLookup {
  const quote = AVERAGES.quotes[code];
  if (quote === undefined) return gap(unsupportedCurrencyReason(code));
  const printed = AVERAGES.years[String(year)]?.[code];
  if (printed === undefined) {
    return gap(`The engine's G.5A table has no ${code} average for ${year}.`);
  }
  const rate = unitsPerDollar(printed, quote);
  return {
    ok: true,
    rate,
    printed,
    day: String(year),
    source: `Federal Reserve G.5A, ${year} average`,
  };
}

/* The Treasury Reporting Rate of Exchange on the last day of the tax year (units per dollar). */
export function yearEndRate(code: string, taxYear: number): RateLookup {
  const table = YEAR_END[taxYear];
  if (table === undefined) return gap(`The engine has no Treasury year-end rates for ${taxYear}.`);
  const printed = table.rates[code];
  if (printed === undefined) return gap(unsupportedCurrencyReason(code));
  const rate = unitsPerDollar(printed, "units_per_dollar");
  return { ok: true, rate, printed, day: table.recordDate, source: "U.S. Treasury" };
}

const isDigits = (part: string, length: number): boolean =>
  part.length === length && [...part].every((char) => char >= "0" && char <= "9");

/* A fact's "MM/DD/YYYY" date as "YYYY-MM-DD", or undefined when it is not a calendar date. */
export function isoDayOf(factDate: string | undefined): string | undefined {
  const [month, day, year, ...rest] = (factDate ?? "").trim().split("/");
  if (rest.length > 0 || !isDigits(month ?? "", 2) || !isDigits(day ?? "", 2)) return undefined;
  if (!isDigits(year ?? "", 4)) return undefined;
  const isoDay = `${year}-${month}-${day}`;
  const time = timeOf(isoDay);
  return Number.isFinite(time) && isoOf(time) === isoDay ? isoDay : undefined;
}
