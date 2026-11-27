/*
 * Form 6765 Section G, lines 49 to 56: one row for each of the first 15
 * business components (qualifiedExpenses.ts sorts them), "Total from
 * attachments" for the rest and "Total". Blank when the fact fills Section F
 * without Section G.
 */

import type { Unsupported } from "../../types.js";
import type { Form6765FilingInfo, Form6765Lines } from "./filingInfo.js";
import { COMPONENT_ROWS, type ColumnAmounts, type ComponentRow } from "./qualifiedExpenses.js";

type Value = number | string | Unsupported | undefined;
type Binding = (form: unknown, info: Form6765FilingInfo) => Value;

const sectionGOf = (info: Form6765FilingInfo) => info.researchCredit?.figures.sectionG;

/* Columns 49(a) to 49(f) of one row, by the field's column letter. */
const IDENTITY_COLUMNS: Record<string, string> = {
  a: "ein",
  b: "activity_code",
  c: "name",
  d: "type",
  e: "software",
  f: "information_sought",
};

function identityValue(column: string, row: ComponentRow, research: Form6765Lines): Value {
  if (column === "c") return row.name;
  // The aggregate entry leaves "all other columns in Section G blank" (irs-6765-inst-2025::sec::d-non-ius::b01).
  if (row.aggregate) return undefined;
  // Column 49(a): "the EIN for the entity associated with this business component" (statistical-sampling::b02); a business with no EIN leaves it blank.
  if (column === "a") return research.business?.ein;
  // Column 49(b): the principal business activity code, Schedule C line B (statistical-sampling::b02).
  if (column === "b") return research.business?.code;
  if (column === "d") return row.type;
  if (column === "e") return row.software;
  // Column 49(f): "not required for timely filed original returns including extensions" (statistical-sampling::b03).
  return undefined;
}

const AMOUNT_COLUMNS: Array<{ line: keyof ColumnAmounts; name: string }> = [
  { line: "line50", name: "direct_research_wages" },
  { line: "line51", name: "direct_supervision_wages" },
  { line: "line52", name: "direct_support_wages" },
  { line: "line53", name: "total_qualified_wages" },
  { line: "line54", name: "cost_of_supplies" },
  { line: "line55", name: "computer_rental_cost" },
  { line: "line56", name: "contract_research" },
];

/* Every Section G field and its rule. */
export function sectionGBindings(): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (let index = 0; index < COMPONENT_ROWS; index += 1) {
    const rowNumber = index + 1;
    for (const [column, name] of Object.entries(IDENTITY_COLUMNS)) {
      bindings[`2.line.49_row_${rowNumber}_col_${column}_${name}`] = (_, info) => {
        const row = sectionGOf(info)?.rows[index];
        const research = info.researchCredit;
        return row === undefined || research === undefined
          ? undefined
          : identityValue(column, row, research);
      };
    }
    for (const { line, name } of AMOUNT_COLUMNS) {
      bindings[`3.line.${line.slice(4)}_row_${rowNumber}_${name}`] = (_, info) =>
        sectionGOf(info)?.rows[index]?.[line];
    }
  }
  for (const { line, name } of AMOUNT_COLUMNS) {
    const number = line.slice(4);
    bindings[`3.line.${number}_total_from_attachments_${name}`] = (_, info) =>
      sectionGOf(info)?.attachments?.[line];
    bindings[`3.line.${number}_total_${name}`] = (_, info) => sectionGOf(info)?.total[line];
  }
  return bindings;
}
