/*
 * The 2025 Earned Income Tax Credit Table in the FTB 3514 booklet (pages
 * 22–30). FTB publishes it only inside the booklet PDF. Each row is "At least",
 * "But not over", then the credit for 0, 1, 2 and 3 qualifying children: six
 * numbers. The first row prints dollar signs ($1 $50 2 7 9 10). The booklet's
 * other pages have no line of that shape, so lines are filtered by shape.
 */

import { extractText } from "unpdf";

export interface CaEitcTableRow {
  low: number;
  high: number;
  children0: number;
  children1: number;
  children2: number;
  children3: number;
}

export interface CaEitcParseResult {
  rows: CaEitcTableRow[];
  diagnostics: { pagesInspected: number; linesInspected: number; linesAccepted: number };
}

const DOLLAR_CELL = String.raw`\$?([\d,]+)`;
const COUNT_CELL = String.raw`([\d,]+)`;
const EITC_ROW_PATTERN = new RegExp(
  `^${DOLLAR_CELL}\\s+${DOLLAR_CELL}\\s+${COUNT_CELL}\\s+${COUNT_CELL}\\s+${COUNT_CELL}\\s+${COUNT_CELL}$`,
);

const wholeDollars = (cell: string) => Number(cell.replaceAll(",", ""));

export async function parseCaEitcTable(pdfBytes: Uint8Array): Promise<CaEitcParseResult> {
  const result = await extractText(pdfBytes);
  const rows: CaEitcTableRow[] = [];
  let linesInspected = 0;
  for (const page of result.text) {
    for (const rawLine of page.split("\n")) {
      const line = rawLine.trim();
      if (!line) continue;
      linesInspected++;
      const match = line.match(EITC_ROW_PATTERN);
      if (!match) continue;
      const [low, high, children0, children1, children2, children3] = match
        .slice(1)
        .map(wholeDollars) as [number, number, number, number, number, number];
      if (low >= high) continue;
      rows.push({ low, high, children0, children1, children2, children3 });
    }
  }
  // The booklet lays each page out in two columns: sort the rows by amount.
  rows.sort((first, second) => first.low - second.low);
  return {
    rows,
    diagnostics: { pagesInspected: result.totalPages, linesInspected, linesAccepted: rows.length },
  };
}
