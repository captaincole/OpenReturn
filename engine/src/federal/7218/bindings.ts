/*
 * MANUAL EDIT: written by hand. Every field of every copy reads one cell of
 * the copy (copies.ts): the header prints on each copy; Part I, Part II lines
 * 1 to 3 and Part III come from the facility, or line 2a and lines 2 and 3
 * from the pass-through credits. A field the copy does not fill is blank.
 *
 * Lines 4 and 5 are for cooperatives, estates and trusts ("Cooperatives,
 * estates, and trusts, go to line 4"; "All others, stop here",
 * irs-7218-face-2025::sec::face-part-ii::b01; line-4-2::b01, ::b02). An
 * individual's return never fills them: no copy has those cells.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { CellValue } from "./cells.js";
import type { Form7218Copy } from "./copies.js";
import type { Form7218FilingInfo } from "./filingInfo.js";
import type { Form7218 } from "./types.js";

const FORM_PREFIX = "form-7218.";
const HEADER = "header";

type Rule = (form: unknown, info: Form7218FilingInfo) => CellValue;

const copyOf = (info: Form7218FilingInfo): Form7218Copy | undefined =>
  info.form7218Copies?.[info.form7218CopyIndex ?? 0];

/* Every catalog field outside the header, read from the copy being printed. */
export function form7218Bindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {
    "0.header.taxpayer_name": (_, info) => (copyOf(info) ? namesOnReturn(info) : undefined),
    "0.header.identifying_number": (_, info) => (copyOf(info) ? info.taxpayerSSN : undefined),
  };
  for (const { fieldId } of catalogJson.fields) {
    const shortKey = fieldId.slice(FORM_PREFIX.length);
    if (shortKey.split(".")[1] === HEADER) continue;
    bindings[shortKey] = (_, info) => copyOf(info)?.cells[shortKey];
  }
  return bindings;
}

export function register(): void {
  defineForm<Form7218, Form7218FilingInfo>("form-7218", {
    bindings: form7218Bindings() as never,
    // The SSN widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
