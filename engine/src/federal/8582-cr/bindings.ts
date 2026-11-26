/*
 * Form 8582-CR, Passive Activity Credit Limitations, for an individual. Lines
 * 1a to 37 come from one computation (form.ts) on Form 3800's passive
 * sources; Part VI from the elections on the passive carryovers.
 */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Carryover } from "../3800/credits.js";
import { passiveLimitOfReturn } from "../3800/form.js";
import type { Form3800Info } from "../3800/tax.js";
import { namesOnReturn } from "../returnNames.js";
import type { LineName } from "./lines.js";
import type { Form8582CR } from "./types.js";

type Accessor = FormAccessor<Form8582CR>;
type Rule = (form: Accessor, info: Form3800Info) => unknown;

/* The catalog field of each line, page 1 then page 2. */
const LINE_FIELDS: ReadonlyArray<[fieldId: keyof Form8582CR, line: LineName]> = [
  ["0.line.1a_rental_active_credits", "line1a"],
  ["0.line.1b_rental_active_prior_unallowed", "line1b"],
  ["0.line.1c_rental_active_total", "line1c"],
  ["0.line.2a_rehab_pre_1990_credits", "line2a"],
  ["0.line.2b_rehab_pre_1990_prior_unallowed", "line2b"],
  ["0.line.2c_rehab_pre_1990_total", "line2c"],
  ["0.line.3a_low_income_post_1989_credits", "line3a"],
  ["0.line.3b_low_income_post_1989_prior_unallowed", "line3b"],
  ["0.line.3c_low_income_post_1989_total", "line3c"],
  ["0.line.4a_other_passive_credits", "line4a"],
  ["0.line.4b_other_passive_prior_unallowed", "line4b"],
  ["0.line.4c_other_passive_total", "line4c"],
  ["0.line.5_total_passive_credits", "line5"],
  ["0.line.6_tax_net_passive_income", "line6"],
  ["0.line.7_credits_over_passive_tax", "line7"],
  ["0.line.8_smaller_line_1c_or_7", "line8"],
  ["0.line.9_150000_threshold", "line9"],
  ["0.line.10_modified_agi", "line10"],
  ["0.line.11_threshold_less_magi", "line11"],
  ["0.line.12_half_of_line_11", "line12"],
  ["0.line.13_form_8582_line_9", "line13"],
  ["0.line.14_remaining_special_allowance", "line14"],
  ["0.line.15_tax_on_line_14", "line15"],
  ["0.line.16_smaller_line_8_or_15", "line16"],
  ["1.line.17_amount_from_line_7", "line17"],
  ["1.line.18_amount_from_line_16", "line18"],
  ["1.line.19_line_17_minus_line_18", "line19"],
  ["1.line.20_smaller_of_2c_or_19", "line20"],
  ["1.line.21_income_limit_250000", "line21"],
  ["1.line.22_modified_adjusted_gross_income", "line22"],
  ["1.line.23_line_21_minus_line_22", "line23"],
  ["1.line.24_half_of_line_23", "line24"],
  ["1.line.25_form_8582_line_9", "line25"],
  ["1.line.26_line_24_minus_line_25", "line26"],
  ["1.line.27_tax_attributable_to_line_26", "line27"],
  ["1.line.28_amount_from_line_18", "line28"],
  ["1.line.29_line_27_minus_line_28", "line29"],
  ["1.line.30_smaller_of_20_or_29", "line30"],
  ["1.line.31_line_19_or_7_minus_16", "line31"],
  ["1.line.32_amount_from_line_30", "line32"],
  ["1.line.33_line_31_minus_line_32", "line33"],
  ["1.line.34_smaller_of_3c_or_33", "line34"],
  ["1.line.35_tax_remaining_special_allowance", "line35"],
  ["1.line.36_smaller_of_34_or_35", "line36"],
  ["1.line.37_passive_activity_credit_allowed", "line37"],
];

/* A line of the computation; every line is the gap when a credit's amount is one. */
const lineRule =
  (line: LineName): Rule =>
  (form, info) => {
    const limit = passiveLimitOfReturn(form, info);
    if (limit === undefined) return undefined;
    if (Object.keys(limit.lines).length === 0 && limit.gap) return limit.gap;
    return limit.lines[line];
  };

/* Part VI: the passive carryovers with a basis increase election (line-38::b01). */
const electionsOf = (info: Form3800Info): Carryover[] =>
  (info.form3800Sources?.carryovers ?? []).filter(
    (carryover) => carryover.passive && carryover.basisIncreaseElection !== undefined,
  );

const ONE_ELECTION_GAP =
  "Part VI has room for one election, and the instructions do not say how a second disposed activity is reported.";

/* Lines 39 to 41 for the one election; a second is a gap. */
const electionRule =
  (pick: (carryover: Carryover) => unknown): Rule =>
  (_, info) => {
    const elections = electionsOf(info);
    if (elections.length > 1) return unsupported(ONE_ELECTION_GAP);
    return elections.length === 1 ? pick(elections[0]) : undefined;
  };

/*
 * Line 40's first line has room for about 40 characters; the rest goes on the
 * second line, at a space. FTB 3801-CR line 20 has the same two lines.
 */
const FIRST_LINE_CHARACTERS = 40;
export function splitDescription(text: string): [string, string | undefined] {
  if (text.length <= FIRST_LINE_CHARACTERS) return [text, undefined];
  const space = text.lastIndexOf(" ", FIRST_LINE_CHARACTERS);
  const cut = space > 0 ? space : FIRST_LINE_CHARACTERS;
  return [text.slice(0, cut), text.slice(cut).trim() || undefined];
}
const description = (carryover: Carryover) =>
  splitDescription(carryover.basisIncreaseElection?.propertyDescription ?? "");

const PART_VI: Record<string, Rule> = {
  "1.line.38_elect_increase_basis": (_, info) => electionsOf(info).length > 0,
  "1.line.39_passive_activity_disposed_name": electionRule((carryover) => carryover.activity?.name),
  "1.line.40_credit_property_description": electionRule((carryover) => description(carryover)[0]),
  "1.line.40_credit_property_description_line2": electionRule(
    (carryover) => description(carryover)[1],
  ),
  "1.line.41_unallowed_credit_reduced_basis": electionRule((carryover) =>
    roundDollars(carryover.basisIncreaseElection?.amount),
  ),
};

export const form8582CRBindings = (): Record<string, Rule> => ({
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
  "0.header.identifying_number": (_, info) => info.taxpayerSSN,
  ...Object.fromEntries(LINE_FIELDS.map(([fieldId, line]) => [fieldId, lineRule(line)])),
  ...PART_VI,
});

export function register(): void {
  defineForm<Form8582CR, Form3800Info>("form-8582-cr", {
    bindings: form8582CRBindings() as never,
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
