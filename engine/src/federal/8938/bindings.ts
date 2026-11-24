/*
 * MANUAL EDIT: written by hand. Page 1 here; Part III in partIIIBindings.ts;
 * page 2 (Parts V and VI) in pageTwo.ts. The form is figured in resolveInfo.ts.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { ExceptedFormsFactValue } from "../../facts/index.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8938FilingInfo } from "./filingInfo.js";
import { partVBindings, partVIBindings } from "./pageTwo.js";
import { partIIIBindings } from "./partIIIBindings.js";
import type { PartIILines, PartILines } from "./rows.js";
import type { Form8938 } from "./types.js";

type Fn = BindingFn<Form8938, Form8938FilingInfo, keyof Form8938>;
type Bindings = Partial<{ [K in keyof Form8938]: BindingFn<Form8938, Form8938FilingInfo, K> }>;

/* "You must specify the applicable calendar year" (irs-8938-inst-2025::sec::when-and-how-to-file::b01): 2025, "20" printed. */
const CALENDAR_YEAR_LAST_TWO_DIGITS = "25";

const partI =
  (pick: (lines: PartILines) => number | boolean | undefined): Fn =>
  (_, info) => {
    const lines = info.form8938?.partI;
    return lines === undefined ? undefined : pick(lines);
  };

const partII =
  (pick: (lines: PartIILines) => number | boolean | undefined): Fn =>
  (_, info) => {
    const lines = info.form8938?.partII;
    return lines === undefined ? undefined : pick(lines);
  };

const yes = (answer: boolean) => (answer ? true : undefined);
const no = (answer: boolean) => (answer ? undefined : true);

/* Part IV (part-iv::b01): "enter the number of forms filed"; blank for a form not filed. */
const partIV =
  (pick: (counts: ExceptedFormsFactValue) => number | undefined): Fn =>
  (_, info) => {
    const counts = info.form8938?.exceptedForms;
    const count = counts === undefined ? undefined : pick(counts);
    return count !== undefined && count > 0 ? count : undefined;
  };

/* The specified individual's header (period-covered::b01, identifying-information::b01, line-3::b01, line-4::b01). */
const header: Record<string, Fn> = {
  "0.header.calendar_year": () => CALENDAR_YEAR_LAST_TWO_DIGITS,
  // A calendar-year return leaves the fiscal-year spaces blank (period-covered::b01).
  "0.header.tax_year_beginning": () => undefined,
  "0.header.tax_year_beginning_year": () => undefined,
  "0.header.tax_year_ending": () => undefined,
  "0.header.tax_year_ending_year": () => undefined,
  // "Check the box ... and enter the number of additional statements" (specific-instructions::b01).
  "0.header.additional_statements_attached": (_, info) => yes((info.form8938?.copies ?? 1) > 1),
  "0.header.number_of_additional_statements": (_, info) => {
    const copies = info.form8938?.copies ?? 1;
    return copies > 1 ? copies - 1 : undefined;
  },
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  // "enter the first TIN shown on your income tax return".
  "0.header.tin": (_, info) => info.taxpayerSSN,
  // A Form 1040 filer is a specified individual: box 3a, and line 4 is skipped.
  "0.line.3a_filer_specified_individual": () => true,
  "0.line.3b_filer_partnership": () => undefined,
  "0.line.3c_filer_corporation": () => undefined,
  "0.line.3d_filer_trust": () => undefined,
  "0.line.4a_specified_person_name": () => undefined,
  "0.line.4b_specified_person_tin": () => undefined,
};

export function register(): void {
  const bindings: Record<string, Fn> = {
    ...header,
    "0.line.5_number_deposit_accounts": partI((lines) => lines.line5),
    "0.line.6_max_value_deposit_accounts": partI((lines) => lines.line6),
    "0.line.7_number_custodial_accounts": partI((lines) => lines.line7),
    "0.line.8_max_value_custodial_accounts": partI((lines) => lines.line8),
    "0.line.9_accounts_closed_yes": partI((lines) => yes(lines.line9Yes)),
    "0.line.9_accounts_closed_no": partI((lines) => no(lines.line9Yes)),
    "0.line.10_number_foreign_assets": partII((lines) => lines.line10),
    "0.line.11_max_value_foreign_assets": partII((lines) => lines.line11),
    "0.line.12_assets_acquired_sold_yes": partII((lines) => yes(lines.line12Yes)),
    "0.line.12_assets_acquired_sold_no": partII((lines) => no(lines.line12Yes)),
    ...partIIIBindings(),
    "0.line.15_number_forms_3520": partIV((counts) => counts.form3520),
    "0.line.16_number_forms_3520a": partIV((counts) => counts.form3520A),
    "0.line.17_number_forms_5471": partIV((counts) => counts.form5471),
    "0.line.18_number_forms_8621": partIV((counts) => counts.form8621),
    "0.line.19_number_forms_8865": partIV((counts) => counts.form8865),
    ...partVBindings(),
    ...partVIBindings(),
  };
  defineForm<Form8938, Form8938FilingInfo>("form-8938", {
    bindings: bindings as Bindings,
    // The TIN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.tin": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
