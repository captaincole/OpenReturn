/*
 * Spot-checks are hand-keyed from the published table and cover every
 * filing-status column. Any change to the extraction logic must keep them passing.
 */

import { engineSrcDir } from "@openreturn/engine/paths";
import { formDir } from "@openreturn/sources";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fetchHtml } from "../../src/tables/fetchHtml.js";
import {
  parseTaxTable,
  validateCoverage,
  type TaxTableRow,
} from "../../src/tables/parseTaxTable.js";
import type { Command } from "../lib/cli";

interface TaxTableSource {
  url: string;
  spotChecks: SpotCheck[];
}

interface SpotCheck {
  taxableIncome: number;
  filingStatus: "single" | "mfj" | "mfs" | "hoh";
  expectedTax: number;
}

const SOURCES: Record<number, TaxTableSource> = {
  2025: {
    url: "https://www.irs.gov/publications/p17",
    spotChecks: [
      { taxableIncome: 0, filingStatus: "single", expectedTax: 0 },
      { taxableIncome: 10, filingStatus: "single", expectedTax: 1 },
      { taxableIncome: 110, filingStatus: "single", expectedTax: 11 },
      { taxableIncome: 7750, filingStatus: "single", expectedTax: 778 },
      { taxableIncome: 57050, filingStatus: "single", expectedTax: 7471 },
      { taxableIncome: 57250, filingStatus: "single", expectedTax: 7515 },
      { taxableIncome: 57250, filingStatus: "mfj", expectedTax: 6396 },
      { taxableIncome: 57250, filingStatus: "mfs", expectedTax: 7515 },
      { taxableIncome: 57250, filingStatus: "hoh", expectedTax: 6533 },
      { taxableIncome: 60050, filingStatus: "mfj", expectedTax: 6732 },
      { taxableIncome: 60050, filingStatus: "hoh", expectedTax: 6869 },
      { taxableIncome: 62600, filingStatus: "single", expectedTax: 8692 },
      { taxableIncome: 62600, filingStatus: "mfj", expectedTax: 7038 },
      { taxableIncome: 62600, filingStatus: "mfs", expectedTax: 8692 },
      { taxableIncome: 62600, filingStatus: "hoh", expectedTax: 7175 },
      { taxableIncome: 63250, filingStatus: "single", expectedTax: 8835 },
      { taxableIncome: 63250, filingStatus: "mfj", expectedTax: 7116 },
      { taxableIncome: 63250, filingStatus: "mfs", expectedTax: 8835 },
      { taxableIncome: 63250, filingStatus: "hoh", expectedTax: 7253 },
      { taxableIncome: 97500, filingStatus: "single", expectedTax: 16370 },
      { taxableIncome: 97500, filingStatus: "mfj", expectedTax: 11284 },
      { taxableIncome: 97500, filingStatus: "mfs", expectedTax: 16370 },
      { taxableIncome: 97500, filingStatus: "hoh", expectedTax: 14631 },
    ],
  },
};

const LOG = "[ingest-federal-tax-table]";

async function run(argv: string[]): Promise<void> {
  const args = parseCmdArgs(argv);
  const year = args.year;
  const source = SOURCES[year];
  if (!source) {
    throw new Error(
      `No source configured for tax year ${year}. Add an entry to SOURCES in scripts/formEngine/ingestFederalTaxTable.ts.`,
    );
  }

  const htmlPath = path.join(formDir(year, "federal"), "tax-table.source.html");
  const jsonPath = path.join(engineSrcDir, "data", `tax-table-${year}.json`);

  console.log(`${LOG} year=${year}`);
  console.log(`${LOG} source ${source.url}`);
  console.log(`${LOG} cache  ${path.relative(process.cwd(), htmlPath)}`);

  const {
    html,
    source: prov,
    cached,
  } = await fetchHtml({
    url: source.url,
    cachePath: htmlPath,
    refresh: args.refresh,
  });
  console.log(
    `${LOG} html ${cached ? "from cache" : "fetched"} ` +
      `(${(html.length / 1024).toFixed(1)}KB, sha256 ${prov.sha256.slice(0, 12)}…)`,
  );

  const rows = parseAndReport(html);
  const coverage = assertCoverage(rows);
  runSpotChecks(source, rows);

  await fs.writeFile(
    jsonPath,
    serializeWithCompactRows(buildHeader(year, prov, coverage), rows),
    "utf8",
  );
  console.log(`${LOG} wrote ${path.relative(process.cwd(), jsonPath)}`);
}

function buildHeader(
  year: number,
  prov: unknown,
  coverage: ReturnType<typeof validateCoverage>,
): Record<string, unknown> {
  return {
    tableId: `federal-${year}`,
    taxYear: year,
    jurisdiction: "federal",
    source: prov,
    coverage: {
      minIncome: coverage.minIncome,
      maxIncome: coverage.maxIncome,
      rowCount: coverage.rowCount,
    },
    boundaryConvention: "half_open",
    filingStatusColumns: {
      single: "single",
      married_filing_jointly: "mfj",
      married_filing_separately: "mfs",
      head_of_household: "hoh",
      qualifying_surviving_spouse: "mfj",
    },
  };
}

function parseAndReport(html: string): TaxTableRow[] {
  const { rows, diagnostics } = parseTaxTable(html);
  console.log(
    `${LOG} parsed ${rows.length} rows ` +
      `(${diagnostics.tablesAccepted}/${diagnostics.tablesInspected} tables accepted)`,
  );
  if (diagnostics.tablesRejected.length > 0) {
    console.warn(
      `${LOG} ${diagnostics.tablesRejected.length} table(s) ` +
        `looked tax-table-shaped but produced no rows:`,
    );
    for (const rejected of diagnostics.tablesRejected) {
      console.warn(
        `  - ${rejected.reason}${rejected.sample ? `\n    sample: ${rejected.sample}` : ""}`,
      );
    }
  }
  return rows;
}

function assertCoverage(rows: TaxTableRow[]): ReturnType<typeof validateCoverage> {
  const coverage = validateCoverage(rows);
  console.log(
    `${LOG} coverage [${coverage.minIncome}, ${coverage.maxIncome}) ` +
      `(${coverage.rowCount} rows, gaps=${coverage.gaps.length}, overlaps=${coverage.overlaps.length})`,
  );
  if (!coverage.ok) {
    if (coverage.gaps.length > 0) {
      console.error(`${LOG} gaps:`, coverage.gaps.slice(0, 5));
    }
    if (coverage.overlaps.length > 0) {
      console.error(`${LOG} overlaps:`, coverage.overlaps.slice(0, 5));
    }
    throw new Error("Coverage validation failed; refusing to write JSON.");
  }
  return coverage;
}

function runSpotChecks(source: (typeof SOURCES)[number], rows: TaxTableRow[]): void {
  const spotResults = source.spotChecks.map((sc) => {
    const row = rows.find(
      (candidate) => sc.taxableIncome >= candidate.low && sc.taxableIncome < candidate.high,
    );
    const got = row ? row[sc.filingStatus] : null;
    return { ...sc, got, pass: got === sc.expectedTax };
  });
  const failed = spotResults.filter((spot) => !spot.pass);
  console.log(
    `${LOG} spot checks ${spotResults.length - failed.length}/${spotResults.length} pass`,
  );
  for (const failure of failed) {
    console.error(
      `  ✗ income=${failure.taxableIncome} status=${failure.filingStatus} expected=${failure.expectedTax} got=${failure.got}`,
    );
  }
  if (failed.length > 0) {
    throw new Error("Spot-check failures; refusing to write JSON.");
  }
}

/* One row per line keeps git diffs small and the file under ~150KB. */
function serializeWithCompactRows(header: Record<string, unknown>, rows: TaxTableRow[]): string {
  const headerJson = JSON.stringify(header, null, 2);
  const headerOpen = headerJson.slice(0, headerJson.lastIndexOf("}"));
  const rowLines = rows
    .map(
      (row) =>
        `    {"low":${row.low},"high":${row.high},"single":${row.single},"mfj":${row.mfj},"mfs":${row.mfs},"hoh":${row.hoh}}`,
    )
    .join(",\n");
  return `${headerOpen.trimEnd()},\n  "rows": [\n${rowLines}\n  ]\n}\n`;
}

function parseCmdArgs(argv: string[]): { year: number; refresh: boolean } {
  let year = 2025;
  let refresh = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--year") {
      const value = argv[++i];
      if (!value || Number.isNaN(Number(value))) throw new Error(`--year requires a number`);
      year = Number(value);
    } else if (arg === "--refresh") {
      refresh = true;
    } else {
      throw new Error(`Unknown arg: ${arg}`);
    }
  }
  return { year, refresh };
}

export const ingestFederalTaxTableCommand: Command = {
  name: "ingest-federal-tax-table",
  summary: "IRS Pub 17 tax table (HTML) → checked-in JSON, with spot-checks",
  options: [
    { flag: "--year <year>", desc: "tax year with a SOURCES entry (default: 2025)" },
    { flag: "--refresh", desc: "re-fetch from irs.gov instead of the cached HTML" },
  ],
  run,
};
