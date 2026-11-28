/*
 * One copy of Form 7218 as cells: the catalog field's key after "form-7218."
 * ("0.part2.3_add_lines_1_and_2", "1.part3.row4_col_h_credit_amount") → the
 * value it prints. bindings.ts reads every field from these keys.
 */

import type { Unsupported } from "../../types.js";

export type CellValue = number | string | boolean | Unsupported | undefined;
export type Cells = Record<string, CellValue>;

export const PART_I = "0.part1.";
export const PART_II = "0.part2.";
export const PART_III = "1.part3.";

/* Part II's fields (irs-7218-face-2025::sec::face-part-ii::b01). */
export const PART_II_FIELDS = {
  line1: `${PART_II}1_amount_from_part3_line25h`,
  line2: `${PART_II}2_credit_from_pass_through`,
  line3: `${PART_II}3_add_lines_1_and_2`,
  line4: `${PART_II}4_allocated_to_patrons_beneficiaries`,
  line5: `${PART_II}5_cooperatives_estates_trusts_credit`,
} as const;

export const LINE_25 = `${PART_III}25_total_of_column_h`;

/* The widget name of each Part III column after `row<n>_col_` (catalog.json). */
export const PART_III_COLUMNS = {
  a: "a_type_of_fuel",
  b: "b_type_of_feedstock",
  c: "c_calendar_year_sold",
  d: "d_emissions_rate",
  e: "e_emissions_factor",
  f: "f_gallons",
  g: "g_applicable_amount",
  h: "h_credit_amount",
} as const;

export type PartIIIColumn = keyof typeof PART_III_COLUMNS;

/* The field key of one Part III cell: row 1 to 24, column (a) to (h). */
export const rowCellKey = (row: number, column: PartIIIColumn) =>
  `${PART_III}row${row}_col_${PART_III_COLUMNS[column]}`;

/* Column (e) as printed: a multiple of 0.1 with its one decimal ("0.5", "1.0"). */
export function tenthsText(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

/* Column (g) as printed: dollars and cents ("1.06", "0.21"). */
export function centsText(value: number): string {
  const [whole, cents = ""] = String(value).split(".");
  return `${whole}.${cents.padEnd(2, "0")}`;
}
