/*
 * Form 172 Part II's fields: two columns, the 2nd preceding tax year (2023)
 * and the 1st preceding tax year (2024), on pages 2 and 3 of the form.
 */

import type { BindingFn } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { carrybackOf } from "./figures.js";
import type { Amount } from "./lines.js";
import type { CarrybackColumn, CarrybackColumns } from "./partII.js";
import type { Info, Read } from "./reads.js";
import type { Form172 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form172]: BindingFn<Form172, Info, K> }>;
type Column = "2nd" | "1st";
type LinePick = (column: CarrybackColumn) => Amount | undefined;

/* Each line's field name and where its amount sits in a column. Line 8 (estates and trusts) and lines 19–21 stay blank. */
const PAGE_2_LINES: Array<[string, LinePick]> = [
  ["1_nol_deduction", (column) => column.line1],
  ["2_taxable_income_before_carryback", (column) => column.line2],
  ["3_net_capital_loss_deduction", (column) => column.line3],
  ["4_section_1202_exclusion", (column) => column.line4],
  ["5_qualified_business_income_deduction", (column) => column.line5],
  ["6_adjustment_to_agi", (column) => column.line6],
  ["7_adjustment_to_itemized_deductions", (column) => column.line7],
  ["8_estates_trusts_exemption_amount", () => undefined],
  ["9_modified_taxable_income", (column) => column.line9],
  ["10_nol_carryover_subsequent_year", (column) => column.line10],
  ["11_agi_before_carryback", (column) => column.itemized?.line11],
  ["12_add_lines_3_through_6", (column) => column.itemized?.line12],
  ["13_modified_agi", (column) => column.itemized?.line13],
  ["14_medical_after_agi_limitation", (column) => column.itemized?.line14],
  ["15_medical_before_agi_limitation", (column) => column.itemized?.line15],
  ["16_modified_agi_times_7_5_pct", (column) => column.itemized?.line16],
  ["17_refigured_medical_deduction", (column) => column.itemized?.line17],
  ["18_medical_adjustment", (column) => column.itemized?.line18],
  ["19_mortgage_insurance_premiums", () => undefined],
  ["20_refigured_mortgage_insurance_premiums", () => undefined],
  ["21_mortgage_insurance_adjustment", () => undefined],
];
const PAGE_3_LINES: Array<[string, LinePick]> = [
  ["22_modified_agi", (column) => column.itemized?.line22],
  ["23_nol_carryback_deducted", (column) => column.itemized?.line23],
  ["24_add_lines_22_23", (column) => column.itemized?.line24],
  ["25_total_charitable_contributions", (column) => column.itemized?.line25],
  ["26_refigured_charitable_contributions", (column) => column.itemized?.line26],
  ["27_charitable_adjustment", (column) => column.itemized?.line27],
  ["28_casualty_theft_deduction", (column) => column.itemized?.line28],
  ["29_casualty_theft_before_agi_limit", (column) => column.itemized?.line29],
  ["30_ten_percent_of_line_22", (column) => column.itemized?.line30],
  ["31_subtract_line_30_from_29", (column) => column.itemized?.line31],
  ["32_casualty_theft_adjustment", (column) => column.itemized?.line32],
  ["33_itemized_deductions_adjustment", (column) => column.itemized?.line33],
];
/* Lines the form never fills for an individual in a 2023 or 2024 column. */
const ALWAYS_BLANK = new Set([
  "8_estates_trusts_exemption_amount",
  "19_mortgage_insurance_premiums",
  "20_refigured_mortgage_insurance_premiums",
  "21_mortgage_insurance_adjustment",
]);

/* "Enter the date the carryback year ends" (irs-172-inst-2025::sec::part-ii-nol-carryover::b02). */
const YEAR_ENDED: Record<Column, string> = { "2nd": "12/31/2023", "1st": "12/31/2024" };

/* One column of the carryback: the column, its gap, or "blank"; undefined while it waits. */
function columnOf(
  form: Read,
  info: Info,
  column: Column,
): CarrybackColumn | Unsupported | "blank" | undefined {
  const carryback = carrybackOf(form, info);
  if (carryback === undefined) return undefined;
  if (carryback === "none") return "blank";
  if ("unsupported" in carryback) return carryback;
  const columns: CarrybackColumns = carryback;
  if (column === "2nd") return columns.secondPreceding;
  return columns.firstPrecedingGap ?? columns.firstPreceding ?? "blank";
}

function lineBinding(column: Column, name: string, pick: LinePick) {
  return (form: Read, info: Info): Amount | undefined => {
    if (ALWAYS_BLANK.has(name)) return undefined;
    const found = columnOf(form, info, column);
    if (found === undefined || found === "blank") return undefined;
    return "unsupported" in found ? found : pick(found);
  };
}

function yearEndedBinding(column: Column) {
  return (form: Read, info: Info): string | Unsupported | undefined => {
    const found = columnOf(form, info, column);
    if (found === undefined || found === "blank") return undefined;
    return "unsupported" in found ? found : YEAR_ENDED[column];
  };
}

/* Every Part II field, both columns. */
export function partIIBindings(): Bindings {
  const bindings: Record<string, unknown> = {};
  for (const column of ["2nd", "1st"] as const) {
    bindings[`1.part2.tax_year_ended_${column}_preceding`] = yearEndedBinding(column);
    bindings[`2.part2.tax_year_ended_${column}_preceding`] = yearEndedBinding(column);
    for (const [name, pick] of PAGE_2_LINES) {
      bindings[`1.part2.${name}_${column}_preceding`] = lineBinding(column, name, pick);
    }
    for (const [name, pick] of PAGE_3_LINES) {
      bindings[`2.part2.${name}_${column}_preceding`] = lineBinding(column, name, pick);
    }
  }
  return bindings as Bindings;
}
