/*
 * The bindings of Parts III to VI, one rule per column (issue #175). Each
 * catalog field `<page>.<part>.<row key>_col_<column>` finds its row in the
 * tables of rows.ts, or its total line, or its Part V or VI row on this copy.
 */

import {
  PART_V_ROWS_PER_COPY,
  PART_VI_ROWS_PER_COPY,
  partVCredits,
  partVICarryovers,
  partVIRow,
  partVRow,
} from "./breakdown.js";
import catalogJson from "./catalog.json";
import { addCells, type Cell } from "./cells.js";
import type { Carryover, CurrentCredit } from "./credits.js";
import {
  carryforwardOf,
  form3800Of,
  form3800RowsOf,
  partIIIRowOf,
  partIIIUsed,
  partIVRowOf,
  usedBy,
  type Form3800Result,
  type Form3800Rows,
} from "./form.js";
import { partIVColumns, type PartIIIColumns } from "./rowLines.js";
import { PART_III_ROWS, PART_IV_ROWS } from "./rows.js";
import type { Accessor, Form3800Info } from "./tax.js";

export type Value = number | string | boolean | Cell;
export type Rule = (form: Accessor, info: Form3800Info) => Value;

const FORM_PREFIX = "form-3800.";
const COLUMN_MARK = "_col_";

/* A table field split into its page, part, row key and column; undefined for any other field. */
function tableFieldOf(fieldId: string) {
  const [page, part, rest] = fieldId.slice(FORM_PREFIX.length).split(".");
  if (rest === undefined || !part.startsWith("part")) return undefined;
  const mark = rest.lastIndexOf(COLUMN_MARK);
  return {
    page: Number(page),
    part,
    key: rest.slice(0, mark),
    column: rest.slice(mark + COLUMN_MARK.length),
  };
}

const withRows =
  (pick: (rows: Form3800Rows) => Value): Rule =>
  (form, info) => {
    const rows = form3800RowsOf(form, info);
    return rows === undefined ? undefined : pick(rows);
  };
const withResult =
  (pick: (result: Form3800Result) => Value): Rule =>
  (form, info) => {
    const result = form3800Of(form, info);
    return result === undefined ? undefined : pick(result);
  };

/* Part III: a row's column (a) to (j); (i) needs the allocation. */
function partIIIRule(line: string, column: string): Rule {
  if (column === "i") {
    return withResult((result) =>
      partIIIUsed(
        result,
        result.current.filter((credit) => credit.line === line),
      ),
    );
  }
  return withRows((rows) => partIIIRowOf(rows, line)?.[column as keyof PartIIIColumns]);
}

const TOTAL_LINES: Readonly<Record<string, (line: string) => boolean>> = {
  "2": (line) => line.startsWith("1"),
  "5": (line) => line.startsWith("4"),
  "6": () => true,
};

/* Part III lines 2, 5 and 6: each column added over the rows it totals. */
function partIIITotalRule(total: string, column: string): Rule {
  const inTotal = TOTAL_LINES[total];
  const credits = (rows: Form3800Rows) => rows.current.filter((credit) => inTotal(credit.line));
  if (column === "i") return withResult((result) => partIIIUsed(result, credits(result)));
  return withRows((rows) => {
    const lines = PART_III_ROWS.filter((row) => inTotal(row.line)).map((row) =>
      partIIIRowOf(rows, row.line),
    );
    return addCells(...lines.map((columns) => columns?.[column as keyof PartIIIColumns] as Cell));
  });
}

const carryoversOn = (rows: Form3800Rows, inLine: (line: string) => boolean): Carryover[] =>
  rows.carryovers.filter((carryover) => inLine(carryover.line));

/* Part IV columns (g) and (i) of a set of carryovers (part-iv-2::b04). */
function usedAndLeft(result: Form3800Result, carryovers: Carryover[], column: "g" | "i"): Cell {
  if (carryovers.length === 0) return undefined;
  const used = usedBy(result, carryovers);
  return column === "g" ? used : carryforwardOf(partIVColumns(carryovers), used);
}

function partIVRule(line: string, column: string): Rule {
  if (column === "g" || column === "i") {
    return withResult((result) =>
      usedAndLeft(
        result,
        carryoversOn(result, (each) => each === line),
        column,
      ),
    );
  }
  return withRows((rows) => {
    const columns = partIVRowOf(rows, line);
    if (column === "b") return columns?.b === undefined ? undefined : String(columns.b);
    return columns?.[column as "a" | "c" | "d" | "e" | "f" | "h"];
  });
}

const PART_IV_TOTALS: Readonly<Record<string, (line: string) => boolean>> = {
  "5": (line) => line.startsWith("4"),
  "6": (line) => line.startsWith("1") || line.startsWith("2"),
  "7": () => true,
};

/* Part IV lines 5, 6 and 7: each column added over its rows. */
function partIVTotalRule(total: string, column: string): Rule {
  const inTotal = PART_IV_TOTALS[total];
  const rowLines = PART_IV_ROWS.filter((row) => inTotal(row.line)).map((row) => row.line);
  if (column === "g" || column === "i") {
    return withResult((result) =>
      addCells(
        ...rowLines.map((line) =>
          usedAndLeft(
            result,
            carryoversOn(result, (each) => each === line),
            column,
          ),
        ),
      ),
    );
  }
  return withRows((rows) =>
    addCells(...rowLines.map((line) => partIVRowOf(rows, line)?.[column as "d" | "e" | "f" | "h"])),
  );
}

const copyIndexOf = (info: Form3800Info) => info.form3800CopyIndex ?? 0;

/* Part V row `slot` of this copy (breakdown.ts). */
function partVRule(slot: number, column: string): Rule {
  return (form, info) => {
    const result = form3800Of(form, info);
    if (result === undefined) return undefined;
    const credit: CurrentCredit | undefined =
      partVCredits(result)[copyIndexOf(info) * PART_V_ROWS_PER_COPY + slot];
    return (
      credit &&
      partVRow(credit, usedBy(result, [credit]))[column as keyof ReturnType<typeof partVRow>]
    );
  };
}

function partVIRule(slot: number, column: string): Rule {
  return (form, info) => {
    const result = form3800Of(form, info);
    if (result === undefined) return undefined;
    const carryover = partVICarryovers(result)[copyIndexOf(info) * PART_VI_ROWS_PER_COPY + slot];
    if (carryover === undefined) return undefined;
    const row = partVIRow(carryover, usedBy(result, [carryover]));
    const value = row[column as keyof typeof row];
    return column === "b" ? String(value) : value;
  };
}

const lineOfKey = (key: string) => key.slice(0, key.indexOf("_"));
const totalKey = (key: string) => key.includes("_add_lines_");

function ruleFor(field: NonNullable<ReturnType<typeof tableFieldOf>>): Rule | undefined {
  const { page, part, key, column } = field;
  const line = lineOfKey(key);
  if (part === "part3") {
    if (totalKey(key)) return partIIITotalRule(line, column);
    return PART_III_ROWS.some((row) => row.page === page && row.key === key)
      ? partIIIRule(line, column)
      : undefined;
  }
  if (part === "part4") {
    if (totalKey(key)) return partIVTotalRule(line, column);
    return PART_IV_ROWS.some((row) => row.page === page && row.key === key)
      ? partIVRule(line, column)
      : undefined;
  }
  const slot = Number(line) - 1;
  if (part === "part5") return partVRule(slot, column);
  return part === "part6" ? partVIRule(slot, column) : undefined;
}

/* Every table field of the catalog and its rule; a field no row knows throws, so a catalog change is caught at load. */
export function tableBindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {};
  for (const { fieldId } of catalogJson.fields) {
    const field = tableFieldOf(fieldId);
    if (field === undefined) continue;
    const rule = ruleFor(field);
    if (rule === undefined) throw new Error(`Form 3800: no row for ${fieldId}`);
    bindings[fieldId.slice(FORM_PREFIX.length)] = rule;
  }
  return bindings;
}
