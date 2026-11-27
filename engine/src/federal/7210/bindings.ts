/*
 * MANUAL EDIT: written by hand. Form 7210, Clean Hydrogen Production Credit:
 * one copy for each facility (facility.ts, resolveInfo.ts). The header names
 * the filer on each copy; every other field reads one cell of the copy being
 * printed. A field the copy does not fill is blank. Line 12 goes to Form 3800
 * Part III line 1g (form3800.ts).
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { CellValue, Form7210Copy, Form7210FilingInfo } from "./filingInfo.js";
import type { Form7210 } from "./types.js";

const FORM_PREFIX = "form-7210.";
const NAME = "0.header.taxpayer_name";
const IDENTIFYING_NUMBER = "0.header.identifying_number";

type Rule = (form: unknown, info: Form7210FilingInfo) => CellValue;

const copyOf = (info: Form7210FilingInfo): Form7210Copy | undefined =>
  info.form7210Copies?.[info.form7210CopyIndex ?? 0];

/* Every catalog field: the header from the return, the rest from the copy's cells. */
export function form7210Bindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {
    [NAME]: (_, info) => (copyOf(info) ? namesOnReturn(info) : undefined),
    // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
    [IDENTIFYING_NUMBER]: (_, info) => (copyOf(info) ? info.taxpayerSSN : undefined),
  };
  for (const { fieldId } of catalogJson.fields) {
    const key = fieldId.slice(FORM_PREFIX.length) as keyof Form7210;
    if (key === NAME || key === IDENTIFYING_NUMBER) continue;
    bindings[key] = (_, info) => copyOf(info)?.cells[key];
  }
  return bindings;
}

export function register(): void {
  defineForm<Form7210, Form7210FilingInfo>("form-7210", {
    bindings: form7210Bindings() as never,
    // The SSN widget (maxLength 11) keeps the dashes.
    formatters: {
      [IDENTIFYING_NUMBER]: (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
