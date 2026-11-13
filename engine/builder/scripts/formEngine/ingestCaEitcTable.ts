/*
 * The 2025 Earned Income Tax Credit Table (FTB 3514 booklet, pages 22–30) →
 * engine/src/data/ca-eitc-table-<year>.json. The booklet is the corpus source
 * of ca-3514-inst-<year>: `instructions.pdf` next to its sidecar (written by
 * `corpus sync`), or downloaded from the sidecar's sourceUrl with --refresh.
 * Either way its sha256 must match the sidecar's.
 *
 * Spot checks are keyed from the printed pages 22, 23, 24, 25, 27, 29 and 30.
 * Any change to the extraction logic must keep them passing.
 */

import { engineSrcDir } from "@openreturn/engine/paths";
import { formDir } from "@openreturn/sources";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCaEitcTable, type CaEitcTableRow } from "../../src/tables/parseCaEitcTable.js";
import { validateCACoverage } from "../../src/tables/parseCATaxTable.js";
import type { Command } from "../lib/cli";

type ChildrenColumn = "children0" | "children1" | "children2" | "children3";

interface SpotCheck {
  amount: number;
  column: ChildrenColumn;
  expectedCredit: number;
}

/* [amount, credit with 0, 1, 2, 3 qualifying children], from the printed rows. */
const PRINTED_ROWS: Record<number, Array<[number, number, number, number, number]>> = {
  2025: [
    [1, 2, 7, 9, 10], // page 22, $1–$50
    [1000, 63, 282, 332, 373], // page 22, 951–1,000
    [7000, 239, 2016, 2372, 2668], // page 23, 6,951–7,000
    [7001, 238, 2014, 2389, 2687], // page 23, 7,001–7,050
    [8001, 229, 1725, 2729, 3070], // page 24, 8,001–8,050
    [13000, 183, 599, 2268, 2551], // page 25, 12,951–13,000 (tcb-ca-010)
    [23850, 84, 273, 381, 386], // page 27, 23,801–23,850
    [28001, 45, 147, 204, 207], // page 29, 28,001–28,050
    [32900, 1, 1, 1, 1], // page 30, 32,851–32,900
  ],
};

const COLUMNS: ChildrenColumn[] = ["children0", "children1", "children2", "children3"];

const spotChecksFor = (year: number): SpotCheck[] =>
  (PRINTED_ROWS[year] ?? []).flatMap(([amount, ...credits]) =>
    credits.map((expectedCredit, index) => ({
      amount,
      column: COLUMNS[index]!,
      expectedCredit,
    })),
  );

const LOG = "[ingest-ca-eitc-table]";

interface Sidecar {
  docId: string;
  sourceUrl: string;
  sha256: string;
}

async function run(argv: string[]): Promise<void> {
  const { year, refresh } = parseCmdArgs(argv);
  const spotChecks = spotChecksFor(year);
  if (spotChecks.length === 0) {
    throw new Error(`No printed rows for tax year ${year}. Add them to PRINTED_ROWS.`);
  }
  const folder = formDir(year, "state/ca/3514");
  const sidecar = JSON.parse(
    await fs.readFile(path.join(folder, "instructions.meta.json"), "utf8"),
  ) as Sidecar;
  const pdfPath = path.join(folder, "instructions.pdf");
  const jsonPath = path.join(engineSrcDir, "data", `ca-eitc-table-${year}.json`);

  const pdfBytes = await loadBooklet(sidecar, pdfPath, refresh);
  const { rows, diagnostics } = await parseCaEitcTable(new Uint8Array(pdfBytes));
  console.log(
    `${LOG} parsed ${rows.length} rows from ${diagnostics.pagesInspected} pages ` +
      `(${diagnostics.linesInspected} lines inspected)`,
  );
  checkCoverage(rows);
  runSpotChecks(spotChecks, rows);

  const header = {
    tableId: `ca-eitc-${year}`,
    taxYear: year,
    jurisdiction: "state-ca",
    source: {
      docId: sidecar.docId,
      url: sidecar.sourceUrl,
      sha256: sidecar.sha256,
      title: `${year} Earned Income Tax Credit Table (FTB 3514 booklet)`,
    },
    boundaryConvention: "inclusive",
    columns: COLUMNS,
  };
  await fs.writeFile(jsonPath, serializeWithCompactRows(header, rows), "utf8");
  console.log(`${LOG} wrote ${path.relative(process.cwd(), jsonPath)}`);
}

async function loadBooklet(sidecar: Sidecar, pdfPath: string, refresh: boolean): Promise<Buffer> {
  let pdfBytes: Buffer;
  if (refresh) {
    console.log(`${LOG} --refresh: fetching ${sidecar.sourceUrl}`);
    const res = await fetch(sidecar.sourceUrl);
    if (!res.ok) throw new Error(`FTB fetch failed: ${res.status} ${res.statusText}`);
    pdfBytes = Buffer.from(await res.arrayBuffer());
  } else {
    pdfBytes = await fs.readFile(pdfPath).catch(() => {
      throw new Error(
        `${pdfPath} is missing: run \`npm run corpus -- sync --doc ${sidecar.docId}\`, or pass --refresh.`,
      );
    });
  }
  const sha256 = createHash("sha256").update(pdfBytes).digest("hex");
  if (sha256 !== sidecar.sha256) {
    throw new Error(`Booklet sha256 ${sha256} does not match the sidecar's ${sidecar.sha256}.`);
  }
  if (refresh) await fs.writeFile(pdfPath, pdfBytes);
  console.log(
    `${LOG} booklet ${(pdfBytes.length / 1024).toFixed(1)}KB, sha256 matches the sidecar`,
  );
  return pdfBytes;
}

function checkCoverage(rows: CaEitcTableRow[]): void {
  const coverage = validateCACoverage(rows);
  console.log(
    `${LOG} coverage [${coverage.minIncome}, ${coverage.maxIncome}] ` +
      `(gaps=${coverage.gaps.length}, overlaps=${coverage.overlaps.length})`,
  );
  if (!coverage.ok) {
    console.error(`${LOG} gaps:`, coverage.gaps.slice(0, 5));
    console.error(`${LOG} overlaps:`, coverage.overlaps.slice(0, 5));
    throw new Error("Coverage validation failed; refusing to write JSON.");
  }
}

function runSpotChecks(spotChecks: SpotCheck[], rows: CaEitcTableRow[]): void {
  const failed = spotChecks.filter((check) => {
    const row = rows.find(
      (candidate) => check.amount >= candidate.low && check.amount <= candidate.high,
    );
    return row?.[check.column] !== check.expectedCredit;
  });
  console.log(`${LOG} spot checks ${spotChecks.length - failed.length}/${spotChecks.length} pass`);
  for (const failure of failed) {
    console.error(
      `  ✗ amount=${failure.amount} ${failure.column} expected=${failure.expectedCredit}`,
    );
  }
  if (failed.length > 0) throw new Error("Spot-check failures; refusing to write JSON.");
}

function serializeWithCompactRows(header: Record<string, unknown>, rows: CaEitcTableRow[]): string {
  const headerJson = JSON.stringify(header, null, 2);
  const headerOpen = headerJson.slice(0, headerJson.lastIndexOf("}"));
  const rowLines = rows
    .map(
      (row) =>
        `    [${row.low}, ${row.high}, ${row.children0}, ${row.children1}, ${row.children2}, ${row.children3}]`,
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

export const ingestCaEitcTableCommand: Command = {
  name: "ingest-ca-eitc-table",
  summary: "CA EITC table (FTB 3514 booklet PDF) → checked-in JSON, with spot-checks",
  options: [
    { flag: "--year <year>", desc: "tax year with PRINTED_ROWS (default: 2025)" },
    { flag: "--refresh", desc: "download the booklet from the sidecar's sourceUrl" },
  ],
  run,
};
