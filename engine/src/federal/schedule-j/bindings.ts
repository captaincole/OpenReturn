/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import { namesOnReturn } from "../returnNames.js";
import { scheduleJOf, type BaseYearLines, type ScheduleJLines } from "./form.js";
import type { ScheduleJ } from "./types.js";

type Accessor = { readonly [fieldId: string]: unknown };
type Value = number | Unsupported | undefined;

/* A line of the form: blank while Schedule J waits (missingInputs), else the figured line. */
function lineOf(pick: (lines: ScheduleJLines) => Value) {
  return (form: Accessor, info: Form1040FilingInfo): Value => {
    const lines = scheduleJOf(form, info);
    return lines === undefined ? undefined : pick(lines);
  };
}

/* A line of one base year's block: 0 is 2022 (lines 5–8), 1 is 2023 (9–12), 2 is 2024 (13–16). */
const yearLine = (index: number, pick: (year: BaseYearLines) => Value) =>
  lineOf((lines) => pick(lines.years[index]));

const BASE_2022 = 0;
const BASE_2023 = 1;
const BASE_2024 = 2;

export function register(): void {
  defineForm<ScheduleJ, Form1040FilingInfo>("schedule-j", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: lines 1 to 4 (the face; specific-instructions::b04, line-2b::b01, line-2c::b01, line-4::b01).
      "0.line.1_taxable_income_2025": lineOf((lines) => lines.line1),
      "0.line.2a_elected_farm_income": lineOf((lines) => lines.line2a),
      "0.line.2b_net_capital_gain_included": lineOf((lines) => lines.line2b),
      "0.line.2c_unrecaptured_1250_gain": lineOf((lines) => lines.line2c),
      "0.line.3_income_less_elected_farm": lineOf((lines) => lines.line3),
      "0.line.4_tax_on_line3_2025": lineOf((lines) => lines.line4),
      // MANUAL EDIT: 2022, lines 5 to 8 (line-5::b01, line-8::b01; baseYears.ts, baseYearTax.ts).
      "0.line.5_base_year_income_2022": yearLine(BASE_2022, (year) => year.income),
      "0.line.6_one_third_farm_income": lineOf((lines) => lines.line6),
      "0.line.7_combined_income_2022": yearLine(BASE_2022, (year) => year.combined),
      "0.line.8_tax_on_line7_2022": yearLine(BASE_2022, (year) => year.tax),
      // MANUAL EDIT: 2023, lines 9 to 12 (line-9::b01, line-12::b01).
      "0.line.9_base_year_income_2023": yearLine(BASE_2023, (year) => year.income),
      "0.line.10_amount_from_line6": yearLine(BASE_2023, (year) => year.share),
      "0.line.11_combined_income_2023": yearLine(BASE_2023, (year) => year.combined),
      "0.line.12_tax_on_line11_2023": yearLine(BASE_2023, (year) => year.tax),
      // MANUAL EDIT: 2024, lines 13 to 16 (line-13::b01, line-16::b01).
      "0.line.13_base_year_income_2024": yearLine(BASE_2024, (year) => year.income),
      "0.line.14_amount_from_line6": yearLine(BASE_2024, (year) => year.share),
      "0.line.15_combined_income_2024": yearLine(BASE_2024, (year) => year.combined),
      "0.line.16_tax_on_line15_2024": yearLine(BASE_2024, (year) => year.tax),
      // MANUAL EDIT: lines 17 to 23 (the face; lines-19-20-and-21::b01).
      "0.line.17_total_base_year_tax": lineOf((lines) => lines.line17),
      "1.line.18_amount_from_line_17": lineOf((lines) => lines.line17),
      "1.line.19_base_year_2022_tax": yearLine(BASE_2022, (year) => year.earlierTax),
      "1.line.20_base_year_2023_tax": yearLine(BASE_2023, (year) => year.earlierTax),
      "1.line.21_base_year_2024_tax": yearLine(BASE_2024, (year) => year.earlierTax),
      "1.line.22_add_lines_19_through_21": lineOf((lines) => lines.line22),
      "1.line.23_tax": lineOf((lines) => lines.line23),
    },

    // The SSN widget (text) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
