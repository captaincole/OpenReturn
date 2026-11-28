/*
 * MANUAL EDIT: written by hand. Every field of every copy reads one cell of
 * the copy (partI.ts, rows.ts, copies.ts), keyed by its catalog field id: the
 * header prints on each copy; the rest is the copy's Part I, its Part II rows
 * (one rule for each row, components.ts) and Parts III and IV. A field the
 * copy does not fill is blank: nothing applies. Lines 8b and 8c are for an
 * estate or trust ("Estates and trusts, go to line 8b ... All others, stop
 * here", face Part II line 8a), so an individual's return leaves them blank.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { Form7207Copy } from "./copies.js";
import type { Form7207FilingInfo } from "./filingInfo.js";
import type { CellValue } from "./partI.js";
import type { Form7207 } from "./types.js";

const FORM_PREFIX = "form-7207.";

type Rule = (form: unknown, info: Form7207FilingInfo) => CellValue;

const copyOf = (info: Form7207FilingInfo): Form7207Copy | undefined =>
  info.form7207Copies?.[info.form7207CopyIndex ?? 0];

/* Every catalog field: the header from the return, the rest from the copy being printed. */
export function form7207Bindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {};
  for (const { fieldId } of catalogJson.fields) {
    const shortKey = fieldId.slice(FORM_PREFIX.length);
    bindings[shortKey] = (_, info) => copyOf(info)?.cells[shortKey];
  }
  bindings["0.header.taxpayer_name"] = (_, info) =>
    copyOf(info) ? namesOnReturn(info) : undefined;
  bindings["0.header.identifying_number"] = (_, info) =>
    copyOf(info) ? info.taxpayerSSN : undefined;
  return bindings;
}

export function register(): void {
  defineForm<Form7207, Form7207FilingInfo>("form-7207", {
    bindings: form7207Bindings() as never,
    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
