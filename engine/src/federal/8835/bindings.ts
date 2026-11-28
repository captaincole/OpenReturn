/*
 * MANUAL EDIT: written by hand. Form 8835, Renewable Electricity Production
 * Credit, one copy per facility and a separate copy for pass-through credits
 * (copies.ts). Every field reads one cell of the copy being printed: the
 * header prints on each copy; a field whose line the copy does not fill is
 * blank.
 *
 * Fields that are blank on every individual's copy:
 * - Line 3's dollar amount and multiplier: "Calendar year filers enter -0- on
 *   line 3" (irs-8835-inst-2025::sec::line-3::b01); the two boxes are for a
 *   fiscal year filer's 2026 sales.
 * - Line 2a and line 3a continued: the first line holds the whole entry.
 * - Lines 16 and 17: "Cooperatives, estates, and trusts" (face-part-ii-2::b01);
 *   all others stop at line 15.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { Form8835Copy } from "./copies.js";
import type { Form8835FilingInfo } from "./filingInfo.js";
import type { LineValue } from "./lines.js";
import type { Form8835 } from "./types.js";

const FORM_PREFIX = "form-8835.";
const HEADER_FIELDS = ["0.header.taxpayer_name", "0.header.identifying_number"];

type Rule = (form: unknown, info: Form8835FilingInfo) => LineValue;

const copyOf = (info: Form8835FilingInfo): Form8835Copy | undefined =>
  info.form8835Copies?.[info.form8835CopyIndex ?? 0];

/* Every catalog field outside the header, read from the copy being printed. */
export function form8835Bindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {
    "0.header.taxpayer_name": (_, info) => (copyOf(info) ? namesOnReturn(info) : undefined),
    // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
    "0.header.identifying_number": (_, info) => (copyOf(info) ? info.taxpayerSSN : undefined),
  };
  for (const { fieldId } of catalogJson.fields) {
    const shortKey = fieldId.slice(FORM_PREFIX.length);
    if (HEADER_FIELDS.includes(shortKey)) continue;
    bindings[shortKey] = (_, info) => copyOf(info)?.cells[shortKey];
  }
  return bindings;
}

export function register(): void {
  defineForm<Form8835, Form8835FilingInfo>("form-8835", {
    bindings: form8835Bindings() as never,
    // The identifying number widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
