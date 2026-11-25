/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form6781FilingInfo } from "./filingInfo.js";
import { line1Columns, LINE_1_ROW_COUNT, partI, type Line1Row, type PartIResult } from "./lines.js";
import { PART_II_FIELDS, PART_III_FIELDS } from "./notModeled.js";
import type { Form6781 } from "./types.js";

type Fn = BindingFn<Form6781, Form6781FilingInfo, keyof Form6781>;
type Bindings = Partial<{ [K in keyof Form6781]: BindingFn<Form6781, Form6781FilingInfo, K> }>;

const OVERFLOW = unsupported(
  "Line 1 has three rows and the instructions give no continuation statement, so the engine does not print a fourth section 1256 row; lines 2 through 9 still count every row.",
);

/* A row of line 1, or the overflow reason when the facts need more rows than the form has. */
function rowOf(info: Form6781FilingInfo, index: number): Line1Row | Unsupported | undefined {
  const rows = info.section1256Rows ?? [];
  return rows.length > LINE_1_ROW_COUNT ? OVERFLOW : rows[index];
}

/*
 * MANUAL EDIT: line 1 (irs-6781-form-2025::sec::specific-instructions::b01): one
 * row per 1099-B (box 11) and per contract with no 1099-B, in fact order.
 */
function line1Bindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (let index = 0; index < LINE_1_ROW_COUNT; index++) {
    const row = `0.line.1_row${index + 1}`;
    const read =
      (pick: (row: Line1Row) => string | number | undefined): Fn =>
      (_, info) => {
        const found = rowOf(info, index);
        if (found === undefined || "unsupported" in found) return found;
        return pick(found);
      };
    out[`${row}_col_a`] = read((found) => found.account);
    out[`${row}_col_b`] = read((found) => line1Columns(found.amount).loss);
    out[`${row}_col_c`] = read((found) => line1Columns(found.amount).gain);
  }
  return out as Bindings;
}

/* Lines 2 through 9 from every line 1 amount; blank while there is none. */
function partIOf(info: Form6781FilingInfo): PartIResult | undefined {
  const rows = info.section1256Rows ?? [];
  return rows.length === 0 ? undefined : partI(rows.map((row) => row.amount));
}

const ELECTION =
  "The engine has no decision for this election; a filer who makes it needs a preparer.";

export function register(): void {
  defineForm<Form6781, Form6781FilingInfo>("form-6781", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      ...line1Bindings(),
      // MANUAL EDIT: irs-6781-form-2025::sec::face-part-i::b01, lines 2–7.
      "0.line.2_total_col_b": (_, info) => partIOf(info)?.line2Loss,
      "0.line.2_total_col_c": (_, info) => partIOf(info)?.line2Gain,
      "0.line.3_net_gain_or_loss": (_, info) => partIOf(info)?.line3,
      "0.line.5_combine_lines_3_and_4": (_, info) => partIOf(info)?.line5,
      // MANUAL EDIT: skipped on a net gain (the Note); else -0-, box D is not checked.
      "0.line.6_loss_carried_back": (_, info) => partIOf(info)?.line6,
      "0.line.7_combine_lines_5_and_6": (_, info) => partIOf(info)?.line7,
      // MANUAL EDIT: face-part-i::b01: 40% and 60% of line 7, nearest dollar.
      "0.line.8_short_term_capital_gain_loss": (_, info) => partIOf(info)?.line8,
      "0.line.9_long_term_capital_gain_loss": (_, info) => partIOf(info)?.line9,
    },

    // The identifying-number widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "0.header.box_a_mixed_straddle_election": `Box A, the mixed straddle election (irs-6781-form-2025::sec::box-a-mixed-straddle-election::b01). ${ELECTION}`,
      "0.header.box_b_straddle_by_straddle_identification_election": `Box B, the straddle-by-straddle identification election (irs-6781-form-2025::sec::box-b-straddle-by-straddle::b01). ${ELECTION}`,
      "0.header.box_c_mixed_straddle_account_election": `Box C, the mixed straddle account election (irs-6781-form-2025::sec::box-c-mixed-straddle-account::b01). ${ELECTION}`,
      "0.header.box_d_net_section_1256_loss_election": `Box D, the net section 1256 contracts loss carryback election (irs-6781-form-2025::sec::box-c-mixed-straddle-account::b02); line 6 is -0- as for a filer who does not check it. ${ELECTION}`,
      "0.line.4_form_1099b_adjustments":
        "Straddle and hedging adjustments to a 1099-B (irs-6781-form-2025::sec::line-4::b01, b02) need a statement the engine has no facts for; line 5 counts line 4 as 0.",
      ...Object.fromEntries(
        PART_II_FIELDS.map((field) => [
          field,
          "Part II, gains and losses from straddles (irs-6781-form-2025::sec::part-ii::b01): the engine has no straddle facts.",
        ]),
      ),
      ...Object.fromEntries(
        PART_III_FIELDS.map((field) => [
          field,
          "Part III, unrecognized gains on positions held at year end (irs-6781-form-2025::sec::part-iii::b01): the engine has no position facts.",
        ]),
      ),
    },
  });
}
