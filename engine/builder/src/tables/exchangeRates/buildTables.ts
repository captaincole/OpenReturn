/*
 * Builds the engine's three exchange-rate tables from the official pages:
 * - the H.10 daily rates, the whole history of each of the 23 currencies;
 * - the G.5A yearly averages, from each release that prints a table;
 * - the Treasury Reporting Rates of Exchange on the last day of a tax year.
 * Each downloaded page is cached in the repository's .scratch/ (never
 * committed). The pages are untrusted input: parsed as data, checked against
 * values typed by hand from the published pages (spotChecks.ts).
 */

import { load } from "cheerio";
import { fetchHtml } from "../fetchHtml.js";
import {
  CURRENCY_SOURCES,
  G5A_BASE,
  H10_HISTORY_BASE,
  H10_PAGE_SETS,
  TREASURY_API,
  type CurrencySource,
  type Quote,
} from "./currencySources.js";
import { dailyYears, type DailyYears } from "./dailyYears.js";
import { parseG5a, type G5aRow } from "./parseG5a.js";
import { parseH10History, type H10Rows } from "./parseH10History.js";

export interface FetchOptions {
  cacheDir: string;
  refresh: boolean;
  log: (line: string) => void;
}

export interface DailyCurrency extends DailyYears {
  quote: Quote;
  pages: string[];
}

export interface DailyTable {
  downloadedOn: string;
  currencies: Record<string, DailyCurrency>;
}

const dayOf = (isoTime: string) => isoTime.slice(0, 10);

/* The earliest download date of the pages a table was built from. */
const earliest = (dates: string[]) => [...dates].sort()[0];

async function page(url: string, file: string, options: FetchOptions) {
  const result = await fetchHtml({
    url,
    cachePath: `${options.cacheDir}/${file}`,
    refresh: options.refresh,
  });
  options.log(`${result.cached ? "cached " : "fetched"} ${url}`);
  return { html: result.html, fetchedOn: dayOf(result.source.fetchedAt) };
}

/* The three history pages of one currency, merged: a date on two pages stops the build. */
async function historyOf(source: CurrencySource, options: FetchOptions) {
  const merged: H10Rows = new Map();
  const pages: string[] = [];
  const fetched: string[] = [];
  for (const set of H10_PAGE_SETS) {
    if (set.before1990 && source.noPageBefore1990 === true) continue;
    const file = `${set.prefix}${source.h10Page}.htm`;
    const { html, fetchedOn } = await page(`${H10_HISTORY_BASE}${file}`, file, options);
    const rows = parseH10History(html, set.century);
    fetched.push(fetchedOn);
    if (rows.size === 0) continue;
    pages.push(`${H10_HISTORY_BASE}${file}`);
    const [firstYear, lastYear] = set.years;
    for (const [date, rate] of rows) {
      const year = Number(date.slice(0, 4));
      if (year < firstYear || year > lastYear) continue;
      if (merged.has(date)) throw new Error(`H.10 ${source.code}: ${date} on two pages`);
      merged.set(date, rate);
    }
  }
  return { rows: merged, pages, fetched };
}

export async function buildDailyTable(options: FetchOptions): Promise<DailyTable> {
  const currencies: Record<string, DailyCurrency> = {};
  const fetched: string[] = [];
  for (const source of CURRENCY_SOURCES) {
    const history = await historyOf(source, options);
    fetched.push(...history.fetched);
    currencies[source.code] = {
      quote: source.quote,
      pages: history.pages,
      ...dailyYears(history.rows, source.firstDay),
    };
  }
  return { downloadedOn: earliest(fetched), currencies };
}

export interface AverageTable {
  downloadedOn: string;
  releases: string[];
  /* Year → currency code → the average as printed. */
  years: Record<string, Record<string, string>>;
  quotes: Record<string, Quote>;
}

/* The release pages the G.5A index lists ("20250106/"), newest first, and the current one. */
async function releaseUrls(options: FetchOptions): Promise<string[]> {
  const index = await page(`${G5A_BASE}default.htm`, "g5a-default.htm", options);
  const dom = load(index.html);
  const dated = dom("a")
    .map((_, link) => dom(link).attr("href") ?? "")
    .get()
    .map((href) => (href.endsWith("/") ? href.slice(0, -1) : href))
    .filter((href) => href.length === 8 && [...href].every((char) => "0123456789".includes(char)))
    .sort()
    .reverse();
  return [`${G5A_BASE}current/`, ...dated.map((date) => `${G5A_BASE}${date}/`)];
}

function addRelease(table: AverageTable, rows: G5aRow[]) {
  for (const source of CURRENCY_SOURCES) {
    const row = rows.find((candidate) => candidate.country === source.g5aCountry);
    if (row === undefined) continue;
    if ((source.quote === "dollars_per_unit") !== row.dollarsPerUnit) {
      throw new Error(`G.5A ${source.code}: the asterisk does not match H.10`);
    }
    for (const [year, average] of row.averages) {
      // A year that begins before the series' unit does mixes two units (Venezuela).
      if (source.firstDay !== undefined && `${year}-01-01` < source.firstDay) continue;
      const byCode = (table.years[String(year)] ??= {});
      // The newest release that prints a year wins: releases are read newest first.
      byCode[source.code] ??= average;
    }
  }
}

export async function buildAverageTable(options: FetchOptions): Promise<AverageTable> {
  const quotes = Object.fromEntries(CURRENCY_SOURCES.map((source) => [source.code, source.quote]));
  const table: AverageTable = { downloadedOn: "", releases: [], years: {}, quotes };
  const fetched: string[] = [];
  for (const url of await releaseUrls(options)) {
    const file = `g5a-${url.slice(G5A_BASE.length, -1)}.htm`;
    const { html, fetchedOn } = await page(url, file, options);
    fetched.push(fetchedOn);
    const rows = parseG5a(html);
    if (rows === null) {
      options.log(`skipped ${url}: no table (preformatted text)`);
      continue;
    }
    table.releases.push(url);
    addRelease(table, rows);
  }
  return { ...table, downloadedOn: earliest(fetched) };
}

export interface YearEndTable {
  taxYear: number;
  recordDate: string;
  source: string;
  downloadedOn: string;
  /* Code → units of the currency per U.S. dollar, as printed. */
  rates: Record<string, string>;
}

interface TreasuryRow {
  country_currency_desc: string;
  exchange_rate: string;
  record_date: string;
  effective_date: string;
}

/* The rate in effect on the record date: the latest effective date on or before it. */
function inEffect(rows: TreasuryRow[], desc: string, recordDate: string): string {
  const matches = rows
    .filter((row) => row.country_currency_desc === desc && row.effective_date <= recordDate)
    .sort((left, right) => left.effective_date.localeCompare(right.effective_date));
  const row = matches[matches.length - 1];
  if (row === undefined) throw new Error(`Treasury: no rate for ${desc} on ${recordDate}`);
  return rateOfTreasury(row.exchange_rate, desc);
}

function rateOfTreasury(printed: string, desc: string): string {
  const value = Number(printed);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Treasury ${desc}: "${printed}"`);
  return printed;
}

export async function buildYearEndTable(
  taxYear: number,
  options: FetchOptions,
): Promise<YearEndTable> {
  const recordDate = `${taxYear}-12-31`;
  const fields = "country_currency_desc,exchange_rate,record_date,effective_date";
  const url = `${TREASURY_API}?fields=${fields}&filter=record_date:eq:${recordDate}&page[size]=500`;
  const { html, fetchedOn } = await page(url, `treasury-${recordDate}.json`, options);
  const parsed = JSON.parse(html) as { data?: TreasuryRow[] };
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  const rates = Object.fromEntries(
    CURRENCY_SOURCES.map((source) => [source.code, inEffect(rows, source.treasury, recordDate)]),
  );
  return { taxYear, recordDate, source: url, downloadedOn: fetchedOn, rates };
}
