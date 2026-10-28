/*
 * FTB publishes the table only as a PDF. CA shares one column for
 * Single+MFS and one for MFJ+QSS, so a row has 5 numbers, not 6.
 * The header repeats on every page, so lines are filtered by shape.
 */

import { extractText } from "unpdf";

export interface CATaxTableRow {
  low: number;
  high: number;
  single_or_mfs: number;
  mfj_or_qss: number;
  hoh: number;
}

export interface CAParseResult {
  rows: CATaxTableRow[];
  diagnostics: {
    pagesInspected: number;
    linesInspected: number;
    linesAccepted: number;
    linesRejected: number;
  };
}

/*
 * FTB renders the first row with dollar-sign prefixes ($1 $50 $0 $0 $0).
 * Accept an optional "$" on each cell so the lowest band parses.
 */
const ROW_RE = /^\$?([\d,]+)\s+\$?([\d,]+)\s+\$?([\d,]+)\s+\$?([\d,]+)\s+\$?([\d,]+)$/;

export async function parseCATaxTable(pdfBytes: Uint8Array): Promise<CAParseResult> {
  const result = await extractText(pdfBytes);
  const rows: CATaxTableRow[] = [];
  const diagnostics: CAParseResult["diagnostics"] = {
    pagesInspected: result.totalPages,
    linesInspected: 0,
    linesAccepted: 0,
    linesRejected: 0,
  };

  for (const page of result.text) {
    for (const rawLine of page.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      diagnostics.linesInspected++;
      const m = line.match(ROW_RE);
      if (!m) {
        diagnostics.linesRejected++;
        continue;
      }
      const nums = [m[1], m[2], m[3], m[4], m[5]].map(parseIntCell);
      if (nums.some((n) => n === null)) {
        diagnostics.linesRejected++;
        continue;
      }
      const [low, high, single_or_mfs, mfj_or_qss, hoh] = nums as number[];
      if (low >= high) {
        diagnostics.linesRejected++;
        continue;
      }
      rows.push({ low, high, single_or_mfs, mfj_or_qss, hoh });
      diagnostics.linesAccepted++;
    }
  }

  return { rows, diagnostics };
}

function parseIntCell(raw: string): number | null {
  const s = raw.replace(/,/g, "").trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export interface CACoverageReport {
  ok: boolean;
  minIncome: number;
  maxIncome: number;
  rowCount: number;
  gaps: { after: number; before: number }[];
  overlaps: { row: CATaxTableRow; previousHigh: number }[];
}

/**
 * FTB rows are "at least .. but not over": `high` is inclusive, so the
 * next row's `low` is `high + 1` ($1–$50, then $51–$150).
 */
export function validateCACoverage(rows: CATaxTableRow[]): CACoverageReport {
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
  const gaps: CACoverageReport["gaps"] = [];
  const overlaps: CACoverageReport["overlaps"] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    if (cur.low > prev.high + 1) gaps.push({ after: prev.high, before: cur.low });
    else if (cur.low <= prev.high) overlaps.push({ row: cur, previousHigh: prev.high });
  }
  return {
    ok: gaps.length === 0 && overlaps.length === 0 && rows[0].low === 1,
    minIncome: rows[0].low,
    maxIncome: rows[rows.length - 1].high,
    rowCount: rows.length,
    gaps,
    overlaps,
  };
}
