/*
 * Form 3800, General Business Credit, for an individual. The header and Parts I
 * and II are here, one entry per line; the rows of Parts III to VI come from
 * one table each (tableBindings.ts).
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Cell } from "./cells.js";
import { anyChanged, form3800Of, form3800RowsOf, type Form3800Result } from "./form.js";
import type { SectionALines, SectionBLines, SectionCLines } from "./lines.js";
import { tableBindings, type Rule } from "./tableBindings.js";
import type { Accessor, Form3800Info } from "./tax.js";
import type { Form3800 } from "./types.js";

const fromResult =
  (pick: (result: Form3800Result) => Cell | boolean): Rule =>
  (form: Accessor, info: Form3800Info) => {
    const result = form3800Of(form, info);
    if (result === undefined) return undefined;
    return result.taxGap ?? pick(result);
  };

const partI =
  (line: "line1" | "line2" | "line3" | "line4" | "line5" | "line6"): Rule =>
  (form, info) => {
    const result = form3800Of(form, info);
    return result?.partI[line];
  };

const sectionA = (line: keyof SectionALines) => fromResult((result) => result.a[line]);
const sectionB = (line: keyof SectionBLines) => fromResult((result) => result.b[line]);
const sectionC = (line: keyof SectionCLines) => fromResult((result) => result.c[line]);

/* The carryforwards of a set of lines that changed from the original return. */
const changedBox =
  (inLines: (line: string) => boolean): Rule =>
  (form, info) => {
    const rows = form3800RowsOf(form, info);
    if (rows === undefined) return undefined;
    return anyChanged(rows.carryovers.filter((carryover) => inLines(carryover.line)));
  };

/* Item B: "If you made an entry in Part III, column (f)" ... "the number of Schedules A (Form 3800) and other transfer election statements" (specific-instructions::b01). */
const transfersOf = (form: Accessor, info: Form3800Info) =>
  form3800RowsOf(form, info)?.current.filter((credit) => credit.transfer !== undefined);

const HEADER: Record<string, Rule> = {
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.identifying_number": (_, info) => info.taxpayerSSN,
  // Item A: an individual is neither an applicable corporation nor an applicable taxpayer (specific-instructions::b01).
  "0.header.a_camt_and_beat_yes": () => false,
  "0.header.a_camt_and_beat_no": () => true,
  "0.header.b_i_part3_col_f_entry_yes": (form, info) => {
    const transfers = transfersOf(form, info);
    return transfers === undefined ? undefined : transfers.length > 0;
  },
  "0.header.b_i_part3_col_f_entry_no": (form, info) => {
    const transfers = transfersOf(form, info);
    return transfers === undefined ? undefined : transfers.length === 0;
  },
  "0.header.b_ii_transfer_election_statements_count": (form, info) => {
    const count = transfersOf(form, info)?.length;
    return count === undefined || count === 0 ? undefined : count;
  },
};

const isGeneral = (line: string) => line.startsWith("1") || line.startsWith("2");
const isSpecified = (line: string) => line.startsWith("4");

/* Parts I and II (irs-3800-face-2025::sec::face-part-i::b01 to face-part-ii-2::b04). */
const PARTS_I_AND_II: Record<string, Rule> = {
  "0.line.1_credits_not_passive_limited": partI("line1"),
  "0.line.2_credits_passive_limited": partI("line2"),
  "0.line.3_passive_credits_allowed": partI("line3"),
  "0.line.4_carryforwards_to_2025": partI("line4"),
  "0.line.4_carryforward_changed_or_revised": changedBox(isGeneral),
  "0.line.5_carrybacks_from_2026": partI("line5"),
  "0.line.6_total_credits_not_allowed_tmt": partI("line6"),
  "0.line.7_regular_tax_before_credits": sectionA("line7"),
  "0.line.8_alternative_minimum_tax": sectionA("line8"),
  "0.line.9_regular_tax_plus_amt": sectionA("line9"),
  "0.line.10a_foreign_tax_credit": sectionA("line10a"),
  "0.line.10b_certain_allowable_credits": sectionA("line10b"),
  "0.line.10c_total_other_credits": sectionA("line10c"),
  "0.line.11_net_income_tax": sectionA("line11"),
  "0.line.12_net_regular_tax": sectionA("line12"),
  "0.line.13_25_percent_of_excess": sectionA("line13"),
  "0.line.14_tentative_minimum_tax": sectionA("line14"),
  "0.line.15_greater_of_line_13_or_14": sectionA("line15"),
  "0.line.16_net_income_tax_less_line_15": sectionA("line16"),
  "0.line.17_credit_allowed_after_38c1_limit": sectionA("line17"),
  "1.line.18_multiply_line_14_by_75_percent": sectionB("line18"),
  "1.line.19_greater_of_line_13_or_18": sectionB("line19"),
  "1.line.20_subtract_line_19_from_11": sectionB("line20"),
  "1.line.21_subtract_line_17_from_20": sectionB("line21"),
  "1.line.22_empowerment_zone_credit_combined": sectionB("line22"),
  "1.line.23_empowerment_zone_passive_credit": sectionB("line23"),
  "1.line.24_empowerment_zone_passive_credit_allowed": sectionB("line24"),
  "1.line.25_add_lines_22_and_24": sectionB("line25"),
  "1.line.26_empowerment_zone_credit_allowed": sectionB("line26"),
  "1.line.27_subtract_line_13_from_11": sectionC("line27"),
  "1.line.28_add_lines_17_and_26": sectionC("line28"),
  "1.line.29_subtract_line_28_from_27": sectionC("line29"),
  "1.line.30_specified_general_business_credit": sectionC("line30"),
  "1.line.32_specified_passive_activity_credits": sectionC("line32"),
  "1.line.33_specified_passive_credits_allowed": sectionC("line33"),
  "1.line.34_specified_credit_carryforward": sectionC("line34"),
  "1.line.34_carryforward_changed_or_revised": changedBox(isSpecified),
  "1.line.35_specified_credit_carryback": sectionC("line35"),
  "1.line.36_add_lines_30_33_34_35": sectionC("line36"),
  "1.line.37_specified_credits_allowed": sectionC("line37"),
  "1.line.38_credit_allowed_current_year": sectionC("line38"),
};

/* Every field's rule: the catalog has no field without one (tests/unit/federal/3800/bindings.test.ts). */
export const form3800Bindings = (): Record<string, Rule> => ({
  ...HEADER,
  ...PARTS_I_AND_II,
  ...tableBindings(),
});

export function register(): void {
  defineForm<Form3800, Form3800Info>("form-3800", {
    bindings: form3800Bindings() as never,
    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
