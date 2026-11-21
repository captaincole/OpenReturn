/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { roundDollars } from "../../money.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8283FilingInfo } from "./filingInfo.js";
import {
  costBasisColumn,
  dateAcquiredColumn,
  doneeNameAndAddress,
  ROWS_PER_FORM,
  vehicleIdentificationNumber,
  type Form8283Row,
} from "./lines.js";
import { FORM_8283_UNSUPPORTED } from "./sectionB.js";
import type { Form8283 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form8283]: BindingFn<Form8283, Form8283FilingInfo, K> }>;

const ROW_LETTERS = ["a", "b", "c", "d"] as const;

const rowOf = (info: Form8283FilingInfo, index: number): Form8283Row | undefined =>
  info.form8283Copies?.[info.form8283CopyIndex ?? 0]?.[index];

/*
 * MANUAL EDIT: Section A line 1, one gift per row (irs-8283-inst-2025::sec::line-1::b01–b05).
 * A row with no gift is blank.
 */
const ROW_CELLS: Record<string, (row: Form8283Row) => unknown> = {
  col_a_donee_name_address: doneeNameAndAddress,
  // Column (b): a qualified vehicle (line-1::b01; qualified-vehicle-donations::b01).
  col_b_vehicle: (row) => row.gift.propertyType === "vehicle",
  col_b_vehicle_identification_number: vehicleIdentificationNumber,
  // Column (c): the description as the taxpayer gave it, with its condition (line-1::b02).
  col_c_property_description: (row) => row.gift.description,
  // Column (d): the date of the gift (line-1::b03).
  col_d_contribution_date: (row) => row.gift.contributionDate,
  col_e_date_acquired: dateAcquiredColumn,
  // Column (f): purchase, gift, inheritance or exchange (line-1::b04).
  col_f_how_acquired: (row) => row.gift.howAcquired?.trim() || undefined,
  col_g_cost_basis: costBasisColumn,
  // Column (h): the FMV or the reduced amount (line-1::b04; lines.ts giftDeduction).
  col_h_fair_market_value: (row) => roundDollars(row.deduction),
  // Column (i): the method used for the FMV (line-1::b05).
  col_i_valuation_method: (row) => row.gift.valuationMethod,
};

function rowBindings(): Bindings {
  const out: Record<string, unknown> = {};
  for (let index = 0; index < ROWS_PER_FORM; index++) {
    for (const [cell, read] of Object.entries(ROW_CELLS)) {
      out[`0.line.1_row_${ROW_LETTERS[index]}_${cell}`] = (
        _: unknown,
        info: Form8283FilingInfo,
      ) => {
        const row = rowOf(info, index);
        return row === undefined ? undefined : read(row);
      };
    }
  }
  return out as Bindings;
}

/* which-sections-to-complete::b02: an individual enters the SSN; a joint return names both spouses. */
const header = {
  name: (_: unknown, info: Form8283FilingInfo) => namesOnReturn(info),
  ssn: (_: unknown, info: Form8283FilingInfo) => info.taxpayerSSN,
};

const formatSsn = (value: string) => SSN.format(value as Parameters<typeof SSN.format>[0]);

export function register(): void {
  defineForm<Form8283, Form8283FilingInfo>("form-8283", {
    bindings: {
      "0.header.taxpayer_name": header.name,
      "0.header.identifying_number": header.ssn,
      "1.header.taxpayer_name": header.name,
      "1.header.identifying_number": header.ssn,
      ...rowBindings(),
    },
    formatters: {
      // The identifying number prints with dashes; the widget is not a comb.
      "0.header.identifying_number": formatSsn,
      "1.header.identifying_number": formatSsn,
    },
    unsupported: FORM_8283_UNSUPPORTED,
  });
}
