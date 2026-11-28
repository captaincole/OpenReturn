/*
 * MANUAL EDIT: written by hand. Every field reads one cell of the copy being
 * printed (copies.ts): the header prints on each copy; the rest is the
 * facility's Part I and Part II, or the separate form's lines 10 and 11. A
 * field the copy does not fill is blank: line 2 (the tax year is calendar year
 * 2025), lines 6a to 6d with no tax-exempt bond, line 10 on a facility's form,
 * and lines 12 and 13 (cooperatives, estates and trusts only).
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import type { CellValue } from "../3468/cells.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { Form7211Copy } from "./copies.js";
import type { Form7211FilingInfo } from "./filingInfo.js";
import type { Form7211 } from "./types.js";

const FORM_PREFIX = "form-7211.";
const HEADER = "header";
/* Column (b) prints the rate in dollars per kWh ("0.03"), not as whole dollars. */
const RATE_FIELDS = ["0.part2.1_applicable_amount_col_b", "0.part2.2_applicable_amount_col_b"];

type Rule = (form: unknown, info: Form7211FilingInfo) => CellValue;

const copyOf = (info: Form7211FilingInfo): Form7211Copy | undefined =>
  info.form7211Copies?.[info.form7211CopyIndex ?? 0];

/* Every catalog field, read from the copy being printed. */
export function form7211Bindings(): Record<string, Rule> {
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

const rateText = (value: unknown) => (typeof value === "number" ? String(value) : "");

export function register(): void {
  defineForm<Form7211, Form7211FilingInfo>("form-7211", {
    bindings: form7211Bindings() as never,
    formatters: {
      // The SSN widget keeps the dashes.
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
      ...Object.fromEntries(RATE_FIELDS.map((field) => [field, rateText])),
    },
  });
}
