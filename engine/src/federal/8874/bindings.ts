/*
 * MANUAL EDIT: written by hand. Form 8874, New Markets Credit, for an
 * individual who holds qualified equity investments in community development
 * entities directly, and may also hold the credit through a K-1. Lines 1 to 3
 * come from the resolver (resolveInfo.ts, lines.ts); line 3 goes to Form 3800
 * Part III line 1i (form3800.ts).
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { Unsupported } from "../../types.js";
import { ISODate, isoDate, SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8874FilingInfo } from "./filingInfo.js";
import { LINE_1_ROWS, type Form8874Lines, type Line1Row } from "./lines.js";
import type { Form8874 } from "./types.js";

/* A line from the resolver's lines; blank while the form does not file. */
const lineOf =
  <T extends number | string>(pick: (lines: Form8874Lines) => T | Unsupported | undefined) =>
  (_: unknown, info: Form8874FilingInfo): T | Unsupported | undefined => {
    const lines = info.newMarketsCredit;
    return lines === undefined ? undefined : pick(lines);
  };

/* Column (c) prints the date as mm/dd/yyyy. */
const printedDate = (date: string | undefined) =>
  date === undefined ? undefined : ISODate.usSlash(isoDate(date));

/*
 * The six columns of line 1 (face-page-1::b01). Column (e): "Enter '5' for
 * the first, second, or third year of the 7-year credit period. For any later
 * year, enter '6'" (irs-8874-form-2025::sec::specific-instructions::b01).
 */
const COLUMNS: Record<string, (row: Line1Row) => number | string | Unsupported | undefined> = {
  cde_name_address_col_a: (row) => row.nameAndAddress,
  cde_ein_col_b: (row) => row.ein,
  initial_investment_date_col_c: (row) => printedDate(row.investmentDate),
  equity_investment_amount_col_d: (row) => row.amount,
  credit_rate_col_e: (row) => (row.ratePercent === undefined ? undefined : String(row.ratePercent)),
  credit_col_f: (row) => row.credit,
};

/* Line 1's 36 cells: row n holds the nth investment, or the "See attached" row (lines.ts). */
type Bindings = Partial<{ [K in keyof Form8874]: BindingFn<Form8874, Form8874FilingInfo, K> }>;

function line1Bindings(): Bindings {
  const out: Record<string, unknown> = {};
  for (let index = 0; index < LINE_1_ROWS; index++) {
    for (const [column, pick] of Object.entries(COLUMNS)) {
      out[`0.line.1_row${index + 1}_${column}`] = lineOf((lines) => {
        const row = lines.rows[index];
        return row === undefined ? undefined : pick(row);
      });
    }
  }
  return out as Bindings;
}

export function register(): void {
  defineForm<Form8874, Form8874FilingInfo>("form-8874", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      ...line1Bindings(),
      // Line 2: each K-1's code AD in whole dollars (resolveInfo.ts).
      "0.line.2_credit_from_pass_through_entities": lineOf((lines) => lines.line2),
      // Line 3: "Add lines 1 and 2 ... All others, report this amount on Form 3800, Part III, line 1i" (face-page-1::b01).
      "0.line.3_add_lines_1_and_2": lineOf((lines) => lines.line3),
    },

    // The identifying number keeps its dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
