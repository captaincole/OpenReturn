/*
 * MANUAL EDIT: written by hand. Every field of every copy reads one cell of
 * the copy (cells.ts): the header prints on each copy; the rest is the
 * facility's part (copies.ts) or the K-1 credits (passThrough.ts). A field the
 * copy does not fill is blank: a facility files a separate form, so its copy
 * leaves the other part blank, and lines 10, 11, 14 and 15 are for estates and
 * trusts ("Estates and trusts, go to line 10 ... All others, stop here",
 * irs-7213-face-2025::sec::face-part-i::b02, face-part-ii::b02), which an
 * individual's return never fills.
 */

import { defineForm, type FormatterFn } from "../../defineForm.js";
import { roundToPlaces } from "../../money.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import catalogJson from "./catalog.json";
import type { CellValue, Form7213Copy } from "./cells.js";
import type { Form7213FilingInfo } from "./filingInfo.js";
import type { Form7213 } from "./types.js";

const FORM_PREFIX = "form-7213.";
const HEADER = "header";

type Rule = (form: unknown, info: Form7213FilingInfo) => CellValue;

const shortKeyOf = (fieldId: string) => fieldId.slice(FORM_PREFIX.length);

const copyOf = (info: Form7213FilingInfo): Form7213Copy | undefined =>
  info.form7213Copies?.[info.form7213CopyIndex ?? 0];

/* Every catalog field outside the header, read from the copy being printed. */
export function form7213Bindings(): Record<string, Rule> {
  const bindings: Record<string, Rule> = {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "0.header.identifying_number": (_, info) => info.taxpayerSSN,
  };
  for (const { fieldId } of catalogJson.fields) {
    const shortKey = shortKeyOf(fieldId);
    if (shortKey.split(".")[1] === HEADER) continue;
    bindings[shortKey] = (_, info) => copyOf(info)?.cells[shortKey];
  }
  return bindings;
}

/* Megawatts keep their decimals (line 6a is line 1 divided by 1,000); the default formatter prints whole dollars. */
const MEGAWATT_PLACES = 6;
const megawatts: FormatterFn<number> = (value) => String(roundToPlaces(value, MEGAWATT_PLACES));

export function register(): void {
  defineForm<Form7213, Form7213FilingInfo>("form-7213", {
    bindings: form7213Bindings() as never,
    formatters: {
      // The SSN widget keeps the dashes.
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.part1_sec2.1_nmcl_allocated_mw": megawatts as never,
      "0.part1_sec2.2_facility_nameplate_capacity_mw": megawatts as never,
      "0.part1_sec2.6a_annual_limitation_mw": megawatts as never,
    },
  });
}
