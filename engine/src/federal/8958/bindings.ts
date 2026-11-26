/*
 * Form 8958, Allocation of Tax Amounts Between Certain Individuals in Community
 * Property States. The header is here; the rows of lines 1–12 come from one
 * table (rows.ts) with one rule per column. The form is a statement: no other
 * form reads it.
 *
 * Column B is the person on this return and column C the spouse or RDP: the
 * header names "Your" first and the spouse or partner second (QUESTIONS.md).
 */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import catalogJson from "./catalog.json";
import type { Form8958FilingInfo } from "./filingInfo.js";
import type { RowEntry } from "./form.js";
import type { Form8958Row } from "./lines.js";
import { COLUMNS, LINES, rowFieldKey, type Column, type LineSpec } from "./rows.js";
import type { Form8958 } from "./types.js";

type Value = string | number | Unsupported | undefined;
type Rule = (form: unknown, info: Form8958FilingInfo) => Value;

const FORM_PREFIX = "form-8958.";
const HEADER_MARK = ".header.";

/* "First name and initial": the middle initial after the first name when there is one. */
const firstAndInitial = (first: string | undefined, initial: string | undefined) =>
  first === undefined ? undefined : initial ? `${first} ${initial}` : first;

/* The 9 digits of an SSN in its three boxes (3, 2 and 4 digits). */
const SSN_PARTS: ReadonlyArray<[number, number]> = [
  [0, 3],
  [3, 5],
  [5, 9],
];

function headerBindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {
    "0.header.first_name_initial": (_, info) =>
      firstAndInitial(info.taxpayerFirstName, info.taxpayerMiddleInitial),
    "0.header.last_name": (_, info) => info.taxpayerLastName,
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    "0.header.spouse_first_name_initial": (_, info) =>
      firstAndInitial(info.spouseFirstName, info.spouseMiddleInitial),
    "0.header.spouse_last_name": (_, info) => info.spouseLastName,
    "0.header.spouse_ssn": (_, info) => info.spouseSSN,
  };
  for (const page of [0, 1]) {
    SSN_PARTS.forEach(([start, end], index) => {
      const part = index + 1;
      bindings[`${page}.header.col_b_ssn_part_${part}`] = (_, info) =>
        info.taxpayerSSN?.slice(start, end);
      bindings[`${page}.header.col_c_ssn_part_${part}`] = (_, info) =>
        info.spouseSSN?.slice(start, end);
    });
  }
  return bindings;
}

const AMOUNT_OF: Readonly<Record<Exclude<Column, "description">, keyof Form8958Row>> = {
  col_a: "a",
  col_b: "b",
  col_c: "c",
};

/* One cell of a row: the description prints while the amounts wait or are a gap. */
function cellOf(entry: RowEntry, column: Column): Value {
  if (column === "description")
    return entry.kind === "row" ? entry.row.description : entry.description;
  if (entry.kind === "waits") return undefined;
  if (entry.kind === "gap") return unsupported(entry.reason);
  return entry.row[AMOUNT_OF[column]];
}

/* The rule for one column of row `row` (0-based) of a line. */
function cellRule(spec: LineSpec, row: number, column: Column): Rule {
  return (_, info) => {
    const line = info.form8958?.[spec.line];
    if (line === undefined) return undefined;
    if (line.kind === "gap") return unsupported(line.reason);
    const entry = line.rows[row];
    return entry === undefined ? undefined : cellOf(entry, column);
  };
}

/* Every table field of the catalog and its rule; a field no line knows throws, so a catalog change is caught at load. */
function tableBindings(): Record<string, Rule> {
  const known = new Map<string, Rule>();
  for (const spec of LINES) {
    for (let row = 0; row < spec.rows; row++) {
      for (const column of COLUMNS) {
        known.set(`${rowFieldKey(spec, row)}_${column}`, cellRule(spec, row, column));
      }
    }
  }
  const bindings: Record<string, Rule> = {};
  for (const { fieldId } of catalogJson.fields) {
    const key = fieldId.slice(FORM_PREFIX.length);
    if (key.includes(HEADER_MARK)) continue;
    const rule = known.get(key);
    if (rule === undefined) throw new Error(`Form 8958: no line for ${fieldId}`);
    bindings[key] = rule;
  }
  return bindings;
}

export function register(): void {
  defineForm<Form8958, Form8958FilingInfo>("form-8958", {
    bindings: { ...headerBindings(), ...tableBindings() } as never,
  });
}
