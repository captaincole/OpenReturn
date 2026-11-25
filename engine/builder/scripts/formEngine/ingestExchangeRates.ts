/*
 * The exchange-rate tables the engine converts foreign amounts with
 * (engine/src/currency/), into engine/src/data/exchange-rates/:
 * - h10-daily.json: every daily rate of the 20 supported currencies, from the
 *   history pages of the Federal Reserve Board's H.10 release;
 * - irs-yearly-average-<year>.json: the IRS yearly average rates of the tax
 *   year for the same 20;
 * - treasury-year-end-<year>.json: the Treasury Reporting Rates of Exchange
 *   on December 31 of the tax year (Form 8938).
 * The pages are cached in the repository's .scratch/exchange-rates/ and read
 * again from there; --refresh downloads them again. Spot checks typed by hand
 * from the published pages must pass before a file is written.
 */

import { ENGINE_ROOT, engineSrcDir } from "@openreturn/engine/paths";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildAverageTable,
  buildDailyTable,
  buildYearEndTable,
  type FetchOptions,
} from "../../src/tables/exchangeRates/buildTables.js";
import { H10_HISTORY_BASE } from "../../src/tables/exchangeRates/currencySources.js";
import {
  checkAverages,
  checkDaily,
  checkYearEnd,
} from "../../src/tables/exchangeRates/spotChecks.js";
import type { Command } from "../lib/cli";

const LOG = "[ingest-exchange-rates]";
const TABLES = ["daily", "averages", "year-end"] as const;
type Table = (typeof TABLES)[number];

const outDir = () => path.join(engineSrcDir, "data", "exchange-rates");

const H10_NOTE =
  "Noon buying rates in New York for cable transfers payable in foreign currencies, as the history pages print them. Each year is one string: one entry per calendar day from January 1, separated by commas; an empty entry is a day with no rate (a weekend, a holiday, ND). quote: units_per_dollar is units of the currency for one U.S. dollar; dollars_per_unit (the release's asterisk) is U.S. dollars for one unit.";

const IRS_NOTE =
  "The IRS yearly average currency exchange rates for the tax year, as the IRS page prints them: units of the currency for one U.S. dollar.";

const TREASURY_NOTE =
  "Treasury Reporting Rates of Exchange (Bureau of the Fiscal Service), the rate in effect on the record date: units of the currency for one U.S. dollar.";

async function writeJson(file: string, value: unknown): Promise<void> {
  const target = path.join(outDir(), file);
  await fs.mkdir(outDir(), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  const { size } = await fs.stat(target);
  console.log(
    `${LOG} wrote ${path.relative(process.cwd(), target)} (${(size / 1024).toFixed(0)} KB)`,
  );
}

function refuseOnFailures(failed: string[]): void {
  if (failed.length === 0) return;
  for (const failure of failed) console.error(`  ✗ ${failure}`);
  throw new Error("Spot-check failures; refusing to write JSON.");
}

async function writeTable(table: Table, year: number, options: FetchOptions): Promise<void> {
  if (table === "daily") {
    const daily = await buildDailyTable(options);
    refuseOnFailures(checkDaily(daily));
    const { downloadedOn, currencies } = daily;
    await writeJson("h10-daily.json", {
      release: "H.10 Foreign Exchange Rates, Board of Governors of the Federal Reserve System",
      source: H10_HISTORY_BASE,
      downloadedOn,
      note: H10_NOTE,
      currencies,
    });
    return;
  }
  if (table === "averages") {
    const averages = await buildAverageTable(year, options);
    refuseOnFailures(checkAverages(averages));
    await writeJson(`irs-yearly-average-${year}.json`, { note: IRS_NOTE, ...averages });
    return;
  }
  const yearEnd = await buildYearEndTable(year, options);
  refuseOnFailures(checkYearEnd(yearEnd));
  await writeJson(`treasury-year-end-${year}.json`, { note: TREASURY_NOTE, ...yearEnd });
}

function parseArgs(argv: string[]) {
  const valueOf = (flag: string) => {
    const index = argv.indexOf(flag);
    return index === -1 ? undefined : argv[index + 1];
  };
  const only = valueOf("--only");
  if (only !== undefined && !TABLES.includes(only as Table)) {
    throw new Error(`--only takes one of ${TABLES.join(", ")}`);
  }
  return {
    refresh: argv.includes("--refresh"),
    year: Number(valueOf("--year") ?? "2025"),
    tables: only === undefined ? [...TABLES] : [only as Table],
  };
}

async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const options: FetchOptions = {
    cacheDir: path.resolve(ENGINE_ROOT, "..", ".scratch", "exchange-rates"),
    refresh: args.refresh,
    log: (line) => console.log(`${LOG} ${line}`),
  };
  for (const table of args.tables) await writeTable(table, args.year, options);
}

export const ingestExchangeRatesCommand: Command = {
  name: "ingest-exchange-rates",
  summary: "refresh the H.10 daily, IRS yearly average and Treasury year-end exchange-rate tables",
  options: [
    { flag: "--only <table>", desc: "one table: daily, averages or year-end" },
    {
      flag: "--year <year>",
      desc: "the tax year of the IRS average and Treasury year-end tables (default 2025)",
    },
    { flag: "--refresh", desc: "download the pages again instead of reading the cache" },
  ],
  run,
};
