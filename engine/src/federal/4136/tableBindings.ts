/*
 * The bindings of the Part II rows, one rule per column (issue #175). Each
 * catalog field `<page>.line.<line>_<slug>_col_<column>` finds its row in
 * rows.ts. Column (c) of lines 13 to 16 and every cents box after page 1 are
 * text widgets in the catalog, so their rules return text.
 */

import { formatDollars, wholePart } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import catalogJson from "./catalog.json";
import type { Form4136FilingInfo } from "./filingInfo.js";
import type { CarrierColumns, Form4136Result, RowColumns } from "./form.js";
import { dollarsAndCents } from "./lines.js";
import { fuelRowOf } from "./rows.js";

export type Value = number | string | boolean | Unsupported | undefined;
export type Rule = (form: unknown, info: Form4136FilingInfo) => Value;

const FORM_PREFIX = "form-4136.";
const LINE_MARK = ".line.";
const COLUMN_MARK = "_col_";
const CENTS_MARK = "_cents";

export const STATEMENT =
  "The row's claims name more than one type of use; the form asks for a separate statement for the others (irs-4136-inst-2025::sec::part-ii-credits::b01), and the engine writes no statements.";

/* Every Part II line, line 17 and Part I: unsupported with a gap, blank with no claim. */
export const withForm =
  (pick: (result: Form4136Result) => Value): Rule =>
  (_, info) => {
    if (info.form4136Gap !== undefined) return unsupported(info.form4136Gap);
    return info.form4136 === undefined ? undefined : pick(info.form4136);
  };

/* Column (c) as text: whole gallons with separators, a fraction as stated. */
export const gallonsText = (gallons: number): string =>
  wholePart(gallons) === gallons ? formatDollars(gallons) : String(gallons);

const asValueType = (text: boolean, value: number): number | string =>
  text ? gallonsText(value) : value;

function rowRule(line: string, column: string, text: boolean): Rule {
  const fromRow = (pick: (row: RowColumns) => Value) =>
    withForm((result) => {
      const row = result.rows.get(fuelRowOf(line)!.line);
      if (row === undefined) return undefined;
      return row.typesDiffer ? unsupported(STATEMENT) : pick(row);
    });
  if (column === "a") return fromRow((row) => row.typeOfUse);
  return fromRow((row) => asValueType(text, row.gallons));
}

function amountRule(line: string, column: string, cents: boolean, text: boolean): Rule {
  const pick = (carrier: CarrierColumns) => (column === "d" ? carrier.cost : carrier.credit);
  return withForm((result) => {
    const carrier = result.carriers.get(fuelRowOf(line)!.line);
    if (carrier === undefined) return undefined;
    const parts = dollarsAndCents(pick(carrier));
    if (!cents) return parts.dollars;
    return text ? parts.cents : Number(parts.cents);
  });
}

/* A table field split into its line, column and cents mark; undefined for any other field. */
function tableFieldOf(fieldId: string) {
  const rest = fieldId.slice(fieldId.indexOf(LINE_MARK) + LINE_MARK.length);
  const mark = rest.lastIndexOf(COLUMN_MARK);
  if (mark < 0) return undefined;
  const after = rest.slice(mark + COLUMN_MARK.length);
  return {
    line: rest.slice(0, rest.indexOf("_")),
    column: after.slice(0, 1),
    cents: after.endsWith(CENTS_MARK),
  };
}

/* Every Part II table field of the catalog and its rule; a field no row knows throws at load. */
export function tableBindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {};
  for (const { fieldId, valueType } of catalogJson.fields) {
    const field = tableFieldOf(fieldId);
    if (field === undefined) continue;
    if (fuelRowOf(field.line) === undefined) throw new Error(`Form 4136: no row for ${fieldId}`);
    const text = valueType === "text";
    const rule =
      field.column === "a" || field.column === "c"
        ? rowRule(field.line, field.column, text)
        : amountRule(field.line, field.column, field.cents, text);
    bindings[fieldId.slice(FORM_PREFIX.length)] = rule;
  }
  return bindings;
}

/* The numeric cents boxes (page 1): two digits, so 5 cents prints "05". */
export function centsFormatters(): Record<string, (value: unknown) => string> {
  const formatters: Record<string, (value: unknown) => string> = {};
  for (const { fieldId, valueType } of catalogJson.fields) {
    if (valueType !== "numeric" || !fieldId.endsWith(CENTS_MARK)) continue;
    formatters[fieldId.slice(FORM_PREFIX.length)] = (value) => String(value).padStart(2, "0");
  }
  return formatters;
}
