/*
 * Tax tables (1040 line 16, 540 line 31) for income under $100,000. Add a table as a JSON file plus an import.
 * Each JSON carries its own filingStatusColumns map (CA shares columns), so lookup stays jurisdiction-agnostic.
 */

import type { FilingStatus } from "../values.js";
import ca2025 from "./ca-tax-table-2025.json" with { type: "json" };
import federal2025 from "./tax-table-2025.json" with { type: "json" };

export interface TaxTableRow {
  low: number;
  high: number;
  [columnName: string]: number;
}

/**
 * "half_open" → row covers [low, high) and row.high === next.low (federal).
 * "inclusive" → row covers [low, high] and row.high + 1 === next.low (CA).
 */
export type BoundaryConvention = "half_open" | "inclusive";

interface LoadedTaxTable {
  tableId: string;
  taxYear: number;
  jurisdiction: string;
  source: {
    url: string;
    fetchedAt: string;
    sha256: string;
    cacheFile: string;
  };
  coverage: { minIncome: number; maxIncome: number; rowCount: number };
  boundaryConvention: BoundaryConvention;
  filingStatusColumns: Record<string, string>;
  rows: TaxTableRow[];
}

const TABLES_BY_ID: Record<string, LoadedTaxTable> = {
  "federal-2025": federal2025 as LoadedTaxTable,
  "ca-2025": ca2025 as LoadedTaxTable,
};

export interface TaxTableLookupOk {
  ok: true;
  tax: number;
  bracket: { low: number; high: number };
  source: { tableId: string; taxYear: number; jurisdiction: string; url: string };
}

export interface TaxTableLookupErr {
  ok: false;
  reason: "table_not_supported" | "filing_status_not_supported" | "out_of_range" | "invalid_input";
  message: string;
}

export type TaxTableLookupResult = TaxTableLookupOk | TaxTableLookupErr;

const err = (reason: TaxTableLookupErr["reason"], message: string): TaxTableLookupErr => ({
  ok: false,
  reason,
  message,
});

function resolveTableColumn(
  tableId: string,
  filingStatus: FilingStatus,
): { table: LoadedTaxTable; column: string } | TaxTableLookupErr {
  const table = TABLES_BY_ID[tableId];
  if (!table) {
    return err(
      "table_not_supported",
      `No tax table loaded for tableId "${tableId}". Available: ${Object.keys(TABLES_BY_ID).join(", ")}.`,
    );
  }
  const column = table.filingStatusColumns[filingStatus];
  if (!column) {
    return err(
      "filing_status_not_supported",
      `Filing status "${filingStatus}" has no column mapping in table "${tableId}".`,
    );
  }
  return { table, column };
}

export function lookupTax(
  tableId: string,
  taxableIncome: number,
  filingStatus: FilingStatus,
): TaxTableLookupResult {
  const resolved = resolveTableColumn(tableId, filingStatus);
  if ("ok" in resolved) return resolved;
  const { table, column } = resolved;
  if (!Number.isFinite(taxableIncome)) {
    return err("invalid_input", `Taxable income must be finite; got ${taxableIncome}.`);
  }
  if (taxableIncome < 0) {
    return err("out_of_range", `Taxable income ${taxableIncome} is negative.`);
  }
  if (aboveCeiling(table, taxableIncome)) {
    return err(
      "out_of_range",
      `Taxable income ${taxableIncome} is above the tax-table ceiling of $${table.coverage.maxIncome} for ${tableId}. Use the appropriate tax-rate schedule / computation worksheet instead.`,
    );
  }
  const row = findRow(table.rows, taxableIncome, table.boundaryConvention);
  if (!row) {
    return err(
      "out_of_range",
      `No tax-table row matched income ${taxableIncome} in ${tableId} — coverage gap in the JSON.`,
    );
  }
  const tax = row[column];
  if (typeof tax !== "number") {
    return err(
      "invalid_input",
      `Row for income ${taxableIncome} in ${tableId} is missing column "${column}".`,
    );
  }
  return {
    ok: true,
    tax,
    bracket: { low: row.low, high: row.high },
    source: {
      tableId: table.tableId,
      taxYear: table.taxYear,
      jurisdiction: table.jurisdiction,
      url: table.source.url,
    },
  };
}

/* Federal stops below $100,000; CA includes $100,000. */
function aboveCeiling(table: LoadedTaxTable, income: number): boolean {
  const max = table.coverage.maxIncome;
  return table.boundaryConvention === "half_open" ? income >= max : income > max;
}

function findRow(
  rows: TaxTableRow[],
  income: number,
  convention: BoundaryConvention,
): TaxTableRow | undefined {
  const includesHigh = (high: number): boolean =>
    convention === "inclusive" ? income <= high : income < high;
  for (const row of rows) {
    if (income >= row.low && includesHigh(row.high)) return row;
    if (row.low > income) return undefined;
  }
  return undefined;
}

export function supportedTableIds(): string[] {
  return Object.keys(TABLES_BY_ID).sort();
}
