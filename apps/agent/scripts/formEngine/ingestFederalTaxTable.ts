/*
 * Ingest the IRS tax table from Pub 17 (HTML) into a checked-in JSON
 * file. The source HTML lives in @summa/sources
 * (<year>/forms/federal/tax-table.source.html); the JSON goes to the engine's
 * src/data/. Reproducible: a re-run with no flags hits the cached HTML and
 * rebuilds the JSON. Use `--refresh` to re-fetch from irs.gov and check
 * for upstream changes since the last ingest (the sha256 changes).
 *
 * Spot-checks are hand-keyed from the published table. Any change to the
 * extraction logic must keep them passing.
 */

import { formDir } from "@summa/sources";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fetchHtml } from "../../src/forms-pipeline/tables/fetchHtml.js";
import {
  parseTaxTable,
  validateCoverage,
  type TaxTableRow,
} from "../../src/forms-pipeline/tables/parseTaxTable.js";
import { engineSrcDir } from "../../src/paths.js";
import type { Command } from "../lib/cli";

/*
 * ─── Per-year source config ──────────────────────────────────────────────
 * To add a new year, add an entry here plus its spot-check set below.
 */

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
    /*
     * Hand-keyed from the published 2025 Tax Table. The picks spread
     * across the table (lowest band, $7k, $57k, $60k, $62k, $63k, and
     * $97k) and exercise every filing-status column at multiple income
     * levels. A regression in one column cannot slip through.
     */
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

// ─── Driver ──────────────────────────────────────────────────────────────

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
    for (const r of diagnostics.tablesRejected) {
      console.warn(`  - ${r.reason}${r.sample ? `\n    sample: ${r.sample}` : ""}`);
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
    const row = rows.find((r) => sc.taxableIncome >= r.low && sc.taxableIncome < r.high);
    const got = row ? row[sc.filingStatus] : null;
    return { ...sc, got, pass: got === sc.expectedTax };
  });
  const failed = spotResults.filter((r) => !r.pass);
  console.log(
    `${LOG} spot checks ${spotResults.length - failed.length}/${spotResults.length} pass`,
  );
  for (const f of failed) {
    console.error(
      `  ✗ income=${f.taxableIncome} status=${f.filingStatus} expected=${f.expectedTax} got=${f.got}`,
    );
  }
  if (failed.length > 0) {
    throw new Error("Spot-check failures; refusing to write JSON.");
  }
}

/*
 * Pretty-print the header object but write each row on its own line.
 * This keeps git diffs small (one inserted row = one line of diff, not
 * eight) and keeps the file under ~150KB.
 */
function serializeWithCompactRows(header: Record<string, unknown>, rows: TaxTableRow[]): string {
  const headerJson = JSON.stringify(header, null, 2);
  // Drop the trailing "}" to append the rows array before the close.
  const headerOpen = headerJson.slice(0, headerJson.lastIndexOf("}"));
  const rowLines = rows
    .map(
      (r) =>
        `    {"low":${r.low},"high":${r.high},"single":${r.single},"mfj":${r.mfj},"mfs":${r.mfs},"hoh":${r.hoh}}`,
    )
    .join(",\n");
  return `${headerOpen.trimEnd()},\n  "rows": [\n${rowLines}\n  ]\n}\n`;
}

function parseCmdArgs(argv: string[]): { year: number; refresh: boolean } {
  let year = 2025;
  let refresh = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--year") {
      const v = argv[++i];
      if (!v || Number.isNaN(Number(v))) throw new Error(`--year requires a number`);
      year = Number(v);
    } else if (a === "--refresh") {
      refresh = true;
    } else {
      throw new Error(`Unknown arg: ${a}`);
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
