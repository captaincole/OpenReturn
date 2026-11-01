/*
 * Pub 17's HTML tables carry the same numbers as the i1040gi.pdf Tax Table
 * and parse far more reliably than PDF text. The page has many other
 * tables, so tax-table chunks are found by header clues and 6 numeric columns.
 */

import { load, type CheerioAPI } from "cheerio";

export interface TaxTableRow {
  low: number;
  high: number;
  single: number;
  mfj: number;
  mfs: number;
  hoh: number;
}

export interface ParseResult {
  rows: TaxTableRow[];
  diagnostics: {
    tablesInspected: number;
    tablesAccepted: number;
    tablesRejected: { reason: string; sample?: string }[];
  };
}

const TAX_TABLE_HEADER_CLUES = [
  /\bif line 1\d\b/i, // "If line 15" in 2025, may shift year-to-year
  /\btaxable income\b/i,
  /\byour tax is\b/i,
];

export function parseTaxTable(html: string): ParseResult {
  const dom = load(html);
  const diagnostics: ParseResult["diagnostics"] = {
    tablesInspected: 0,
    tablesAccepted: 0,
    tablesRejected: [],
  };

  const rows: TaxTableRow[] = [];

  dom("table").each((_, el) => {
    diagnostics.tablesInspected++;
    const $table = dom(el);
    if (!looksLikeTaxTable(dom, $table)) {
      /* No reason per non-tax table: the page has dozens of them. */
      return;
    }
    const collected = extractRows(dom, $table);
    if (collected.rows.length === 0) {
      diagnostics.tablesRejected.push({
        reason: "tax-table-shaped but produced zero parsable rows",
        sample: $table.find("tbody tr").first().text().trim().slice(0, 120),
      });
      return;
    }
    diagnostics.tablesAccepted++;
    rows.push(...collected.rows);
  });

  return { rows, diagnostics };
}

function looksLikeTaxTable(dom: CheerioAPI, $table: ReturnType<CheerioAPI>): boolean {
  const headText = $table.find("thead").text().toLowerCase();
  if (!headText) return false;
  const cluesMatched = TAX_TABLE_HEADER_CLUES.filter((rx) => rx.test(headText));
  if (cluesMatched.length < 2) return false;

  const $firstBodyRow = $table.find("tbody > tr").first();
  if ($firstBodyRow.length === 0) return false;
  const cells = $firstBodyRow.find("td");
  if (cells.length !== 6) return false;
  for (let i = 0; i < cells.length; i++) {
    if (parseIntCell(dom(cells[i]).text()) === null) return false;
  }
  return true;
}

function extractRows(dom: CheerioAPI, $table: ReturnType<CheerioAPI>): { rows: TaxTableRow[] } {
  const rows: TaxTableRow[] = [];
  $table.find("tbody > tr").each((_, tr) => {
    const cells = dom(tr).find("td");
    if (cells.length !== 6) return;
    const nums = [0, 1, 2, 3, 4, 5].map((i) => parseIntCell(dom(cells[i]).text()));
    if (nums.some((num) => num === null)) return;
    const [low, high, single, mfj, mfs, hoh] = nums as number[];
    if (low >= high) return;
    rows.push({ low, high, single, mfj, mfs, hoh });
  });
  return { rows };
}

function parseIntCell(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, "").trim();
  if (cleaned === "") return null;
  if (!/^-?\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export interface CoverageReport {
  ok: boolean;
  minIncome: number;
  maxIncome: number;
  rowCount: number;
  gaps: { after: number; before: number }[];
  overlaps: { row: TaxTableRow; previousHigh: number }[];
}

/** IRS rows are half-open: row[i].high === row[i+1].low. Row widths vary in the lowest band. */
export function validateCoverage(rows: TaxTableRow[]): CoverageReport {
  if (rows.length === 0) {
    return {
      ok: false,
      minIncome: 0,
      maxIncome: 0,
      rowCount: 0,
      gaps: [],
      overlaps: [],
    };
  }
  const gaps: CoverageReport["gaps"] = [];
  const overlaps: CoverageReport["overlaps"] = [];
  let prev = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cur = rows[i];
    if (cur.low > prev.high) gaps.push({ after: prev.high, before: cur.low });
    else if (cur.low < prev.high) overlaps.push({ row: cur, previousHigh: prev.high });
    prev = cur;
  }
  return {
    ok: gaps.length === 0 && overlaps.length === 0 && rows[0].low === 0,
    minIncome: rows[0].low,
    maxIncome: rows[rows.length - 1].high,
    rowCount: rows.length,
    gaps,
    overlaps,
  };
}
