/*
 * The lines of Form 8958 as one table: each line's catalog key, its page and how
 * many rows the printed form gives it. A row's fields are
 * `<page>.line.<key>_row_<n>_<column>` in catalog.json (line 4 has one row and
 * no `_row_<n>`); the columns are the description, A, B and C.
 */

import type { CommunityPropertyLine } from "../../facts/index.js";

/* What fills a line: items stated on it, or rows the engine derives from other items. */
export type LineSource =
  CommunityPropertyLine | "deductible_self_employment_tax" | "taxes_withheld";

export interface LineSpec {
  /* The line number as the form prints it. */
  line: number;
  source: LineSource;
  page: number;
  key: string;
  rows: number;
}

/* Lines 1–12 (irs-8958-form-2025::sec::face-page-1::b01, face-page-2::b01). */
export const LINES: ReadonlyArray<LineSpec> = [
  { line: 1, source: "wages", page: 0, key: "1_wages_each_employer", rows: 5 },
  { line: 2, source: "interest", page: 0, key: "2_interest_income_each_payer", rows: 3 },
  { line: 3, source: "dividends", page: 0, key: "3_dividends_each_payer", rows: 3 },
  {
    line: 4,
    source: "state_income_tax_refund",
    page: 0,
    key: "4_state_income_tax_refund",
    rows: 1,
  },
  { line: 5, source: "self_employment_income", page: 0, key: "5_self_employment_income", rows: 3 },
  { line: 6, source: "capital_gain_or_loss", page: 0, key: "6_capital_gains_losses", rows: 2 },
  { line: 7, source: "pension", page: 0, key: "7_pension_income", rows: 2 },
  {
    line: 8,
    source: "rents_royalties_partnerships_estates_trusts",
    page: 0,
    key: "8_rents_royalties_partnerships_trusts",
    rows: 3,
  },
  {
    line: 9,
    source: "deductible_self_employment_tax",
    page: 1,
    key: "9_deductible_se_tax",
    rows: 4,
  },
  { line: 10, source: "self_employment_tax", page: 1, key: "10_self_employment_tax", rows: 4 },
  { line: 11, source: "taxes_withheld", page: 1, key: "11_taxes_withheld", rows: 4 },
  { line: 12, source: "other", page: 1, key: "12_other_items", rows: 12 },
];

export const COLUMNS = ["description", "col_a", "col_b", "col_c"] as const;
export type Column = (typeof COLUMNS)[number];

/* A row's field key before the column, without the form id: "0.line.1_wages_each_employer_row_2". */
export function rowFieldKey(spec: LineSpec, row: number): string {
  const rowPart = spec.rows === 1 ? "" : `_row_${row + 1}`;
  return `${spec.page}.line.${spec.key}${rowPart}`;
}
