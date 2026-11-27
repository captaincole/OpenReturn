/*
 * MANUAL EDIT: written by hand. Every field of every copy reads one cell of
 * the copy (cells.ts): the header prints on each copy; the rest is the copy's
 * Part I and the part that figures its credit (copies.ts). A field whose line
 * the copy does not fill is blank.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { CellValue } from "./cells.js";
import type { Form3468Copy } from "./copies.js";
import type { Form3468FilingInfo } from "./filingInfo.js";
import type { Form3468 } from "./types.js";

const FORM_PREFIX = "form-3468.";
const HEADER = "header";

type Rule = (form: unknown, info: Form3468FilingInfo) => CellValue;

const shortKeyOf = (fieldId: string) => fieldId.slice(FORM_PREFIX.length);

/* The cell keys of a field: `<part>.<widget>`, and `<part>.<line>` (the text before the first "_"). */
export function cellKeysOf(shortKey: string): { full: string; line: string } {
  const [, part, widget] = shortKey.split(".");
  const [line] = widget!.split("_");
  return { full: `${part}.${widget}`, line: `${part}.${line}` };
}

/* The lines with more than one widget: only their full keys name a cell. */
export function sharedLines(): Set<string> {
  const counts = new Map<string, number>();
  for (const { fieldId } of catalogJson.fields) {
    const { line } = cellKeysOf(shortKeyOf(fieldId));
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([line]) => line));
}

const copyOf = (info: Form3468FilingInfo): Form3468Copy | undefined =>
  info.form3468Copies?.[info.form3468CopyIndex ?? 0];

/* The cell a field prints, from a copy's cells. */
export function cellOf(copy: Form3468Copy, shortKey: string, shared: Set<string>): CellValue {
  const { full, line } = cellKeysOf(shortKey);
  if (full in copy.cells) return copy.cells[full];
  return shared.has(line) ? undefined : copy.cells[line];
}

/* Every catalog field outside the header, read from the copy being printed. */
export function form3468Bindings(): Record<string, Rule> {
  const shared = sharedLines();
  const bindings: Record<string, Rule> = {
    "0.header.taxpayer_name": (_, info) => (copyOf(info) ? namesOnReturn(info) : undefined),
    "0.header.identifying_number": (_, info) => (copyOf(info) ? info.taxpayerSSN : undefined),
  };
  for (const { fieldId } of catalogJson.fields) {
    const shortKey = shortKeyOf(fieldId);
    if (shortKey.split(".")[1] === HEADER) continue;
    bindings[shortKey] = (_, info) => {
      const copy = copyOf(info);
      return copy === undefined ? undefined : cellOf(copy, shortKey, shared);
    };
  }
  return bindings;
}

export function register(): void {
  defineForm<Form3468, Form3468FilingInfo>("form-3468", {
    bindings: form3468Bindings() as never,
    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
