/*
 * MANUAL EDIT: written by hand. Page 1 holds Parts I and II; page 2 Part III
 * (20 rows of Forms 1097-BTC) and page 3 one Part IV (one bond). Copy n of the
 * form prints the nth group of 20 Part III rows and the nth Part IV; Part I
 * adds every copy (irs-8912-inst-2025::sec::line-14::b01, ::line-20::b01).
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { roundDollars, roundToPlaces } from "../../money.js";
import { ISODate, isoDate, SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  line12Of,
  partIIIPages,
  partIILine,
  partIOf,
  type Accessor,
  type Form8912CreditInfo,
} from "./credit.js";
import type { Form8912FilingInfo, PartIIIRow, PartIVForm, PartIVRow } from "./filingInfo.js";
import { line14, PART_III_ROWS, PART_IV_ROWS, type PartIILines, type PartILines } from "./lines.js";
import type { Form8912 } from "./types.js";

type Info = Form8912CreditInfo;
type Fn = (form: Accessor, info: Info) => unknown;
type Bindings = Partial<{ [K in keyof Form8912]: BindingFn<Form8912, Form8912FilingInfo, K> }>;

const copyOf = (info: Form8912FilingInfo) => info.form8912CopyIndex ?? 0;

/* A Part I line; blank before the form files or while a Part IV waits. */
const partILine =
  (pick: (lines: PartILines) => number | undefined): Fn =>
  (_, info) => {
    const lines = partIOf(info);
    return lines === undefined ? undefined : pick(lines);
  };

const partIILineOf =
  (pick: (lines: PartIILines) => number | undefined): Fn =>
  (form, info) =>
    partIILine(form, info, pick);

/* The Part III rows this copy prints. */
const partIIIRowsOnCopy = (info: Form8912FilingInfo): PartIIIRow[] => {
  const start = copyOf(info) * PART_III_ROWS;
  return info.form8912?.partIII.slice(start, start + PART_III_ROWS) ?? [];
};

/* Line 13, columns (a), (b1), (b2) and (c) of each row (part-iii-bond-credit-s-reported-to-you-on::b01). */
function partIIIBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let slot = 0; slot < PART_III_ROWS; slot++) {
    const row = (info: Info) => partIIIRowsOnCopy(info)[slot];
    const prefix = `1.line.13_row${slot + 1}_col_`;
    out[`${prefix}a`] = (_, info) => row(info)?.filerName;
    out[`${prefix}b1`] = (_, info) => row(info)?.filerTin;
    out[`${prefix}b2`] = (_, info) => row(info)?.uniqueIdentifier;
    out[`${prefix}c`] = (_, info) => roundDollars(row(info)?.amount);
  }
  // Line 14: this copy's column (c), cents kept until the total; blank with no row.
  out["1.line.14_total_bond_credits_1097_btc"] = (_, info) => {
    const page = info.form8912 ? partIIIPages(info.form8912)[copyOf(info)] : undefined;
    return page === undefined ? undefined : line14(page);
  };
  return out;
}

const partIVOnCopy = (info: Form8912FilingInfo): PartIVForm | undefined =>
  info.form8912?.partIV[copyOf(info)];

const printedDate = (date: string | undefined) =>
  date === undefined ? undefined : ISODate.usSlash(isoDate(date));

/* Column (c) prints the rate as a percentage ("Credit rate"); column (e) the number under its "%". */
const PERCENT = 100;
const RATE_PLACES = 4;
const printedRate = (rate: number) => `${roundToPlaces(rate * PERCENT, RATE_PLACES)}%`;

/* The cells of one line 18 row; a pass-through row fills only column (f) (line-18-column-a::b04). */
const ROW_CELLS: Record<string, (row: PartIVRow) => unknown> = {
  a: (row) => row.identifier,
  b: (row) => row.columns?.b,
  c: (row) => (row.columns ? printedRate(row.columns.c) : undefined),
  d: (row) => row.columns?.d,
  e: (row) => (row.columns ? String(row.columns.e) : undefined),
  f: (row) => row.f,
};

/* Lines 15a to 20 of this copy's Part IV (irs-8912-inst-2025::sec::line-15a::b01 to line-20::b01). */
function partIVBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {
    "2.line.15a_bond_issuer_name_city_state": (_, info) => partIVOnCopy(info)?.issuer,
    "2.line.15b_bond_issuer_ein": (_, info) => partIVOnCopy(info)?.issuerEin,
    "2.line.16a_date_bond_issued": (_, info) => printedDate(partIVOnCopy(info)?.issueDate),
    "2.line.16b_date_bond_matures": (_, info) => printedDate(partIVOnCopy(info)?.maturityDate),
    // Line 17: "If the bond was redeemed, sold, or otherwise disposed of, enter the date."
    "2.line.17_date_bond_disposed": (_, info) => printedDate(partIVOnCopy(info)?.disposedDate),
    "2.line.19_add_line_18_col_f": (_, info) => partIVOnCopy(info)?.lines?.line19,
    "2.line.20_bond_credit_not_on_1097btc": (_, info) => partIVOnCopy(info)?.lines?.line20,
  };
  for (let slot = 0; slot < PART_IV_ROWS; slot++) {
    for (const [column, cell] of Object.entries(ROW_CELLS)) {
      out[`2.line.18_row${slot + 1}_col_${column}`] = (_, info) => {
        const row = partIVOnCopy(info)?.lines?.rows[slot];
        return row === undefined ? undefined : cell(row);
      };
    }
  }
  return out;
}

const HEADER_PAGES = [0, 1, 2];

function headerBindings(): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (const page of HEADER_PAGES) {
    out[`${page}.header.taxpayer_name`] = (_, info) => namesOnReturn(info);
    out[`${page}.header.identifying_number`] = (_, info) => info.taxpayerSSN;
  }
  return out;
}

const ssnFormatter = (value: unknown) => SSN.format(value as Parameters<typeof SSN.format>[0]);

export function register(): void {
  const bindings: Record<string, Fn> = {
    ...headerBindings(),
    "0.line.1_bond_credits_part_iii": partILine((lines) => lines.line1),
    "0.line.2_bond_credits_part_iv": partILine((lines) => lines.line2),
    "0.line.3_carryforward_of_credits": partILine((lines) => lines.line3),
    "0.line.4_total_credit": partILine((lines) => lines.line4),
    // Lines 5 and 6 are for estates and trusts only; an individual's return leaves them blank.
    "0.line.5_allocated_to_beneficiaries": () => undefined,
    "0.line.6_estates_trusts_credit": () => undefined,
    "0.line.7_regular_tax_before_credits": partIILineOf((lines) => lines.line7),
    "0.line.8_alternative_minimum_tax": partIILineOf((lines) => lines.line8),
    "0.line.9_regular_tax_plus_amt": partIILineOf((lines) => lines.line9),
    "0.line.10a_foreign_tax_credit": partIILineOf((lines) => lines.line10a),
    "0.line.10b_certain_allowable_credits": partIILineOf((lines) => lines.line10b),
    "0.line.10c_general_business_credit": partIILineOf((lines) => lines.line10c),
    "0.line.10d_prior_year_minimum_tax_credit": partIILineOf((lines) => lines.line10d),
    "0.line.10e_total_credits": partIILineOf((lines) => lines.line10e),
    "0.line.11_net_income_tax": partIILineOf((lines) => lines.line11),
    "0.line.12_credit_allowed_current_year": (form, info) => line12Of(form, info),
    ...partIIIBindings(),
    ...partIVBindings(),
  };
  defineForm<Form8912, Form8912FilingInfo>("form-8912", {
    bindings: bindings as Bindings,
    formatters: {
      "0.header.identifying_number": ssnFormatter,
      "1.header.identifying_number": ssnFormatter,
      "2.header.identifying_number": ssnFormatter,
    },
  });
}
