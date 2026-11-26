/*
 * FTB 3801-CR, Passive Activity Credit Limitations, for a Form 540 filer.
 * Lines 1a to 17 come from one computation (form.ts) on the California passive
 * credit facts; Part IV from the elections on the column (b) credits.
 */

import { defineForm, type FormAccessor } from "../../../defineForm.js";
import type { Carryover } from "../../../federal/3800/credits.js";
import { splitDescription } from "../../../federal/8582-cr/bindings.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { roundDollars } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { SSN } from "../../../values.js";
import type { Form3801CRInfo } from "./filingInfo.js";
import { caPassiveCreditLimitOf } from "./form.js";
import type { Form3801CRLines } from "./lines.js";
import type { Form3801CR } from "./types.js";

type Accessor = FormAccessor<Form3801CR>;
type Rule = (form: Accessor, info: Form3801CRInfo) => unknown;

/* The catalog field of each line, page 1 then page 2. */
const LINE_FIELDS: ReadonlyArray<[fieldId: keyof Form3801CR, line: keyof Form3801CRLines]> = [
  ["0.line.1a_rental_real_estate_credits", "line1a"],
  ["0.line.1b_rental_real_estate_prior_unallowed", "line1b"],
  ["0.line.1c_rental_real_estate_total", "line1c"],
  ["0.line.2a_housing_pre_1990_credits", "line2a"],
  ["0.line.2b_housing_pre_1990_prior_unallowed", "line2b"],
  ["0.line.2c_housing_pre_1990_total", "line2c"],
  ["0.line.3a_housing_post_1989_credits", "line3a"],
  ["0.line.3b_housing_post_1989_prior_unallowed", "line3b"],
  ["0.line.3c_housing_post_1989_total", "line3c"],
  ["0.line.4a_other_passive_credits", "line4a"],
  ["0.line.4b_other_passive_prior_unallowed", "line4b"],
  ["0.line.4c_other_passive_total", "line4c"],
  ["0.line.5_total_passive_credits", "line5"],
  ["0.line.6_tax_on_net_passive_income", "line6"],
  ["0.line.7_credits_over_passive_tax", "line7"],
  ["0.line.8_smaller_of_1c_or_7", "line8"],
  ["0.line.9_special_allowance_income_limit", "line9"],
  ["0.line.10_federal_modified_agi", "line10"],
  ["0.line.11_limit_minus_modified_agi", "line11"],
  ["0.line.12_half_of_line_11", "line12"],
  ["0.line.13_ftb_3801_line_9_amount", "line13"],
  ["0.line.14_remaining_special_allowance", "line14"],
  ["0.line.15_tax_on_line_14_amount", "line15"],
  ["0.line.16_smaller_of_8_or_15", "line16"],
  ["1.line.17_passive_activity_credits_allowed", "line17"],
];

/* A line of the computation; every line is the gap when a credit's amount is one. */
const lineRule =
  (line: keyof Form3801CRLines): Rule =>
  (form, info) => {
    const limit = caPassiveCreditLimitOf(form, info);
    if (limit === undefined) return undefined;
    if (Object.keys(limit.lines).length === 0 && limit.gap) return limit.gap;
    return limit.lines[line];
  };

/*
 * Part IV: the column (b) credits with a basis increase election
 * (ca-3801cr-inst-2025::sec::part-iv-election-to-increase-basis-of-credit-property-2::b01).
 */
const electionsOf = (info: Form3801CRInfo): Carryover[] =>
  (info.caPassiveCreditSources ?? []).flatMap((source) =>
    "originYear" in source && source.basisIncreaseElection !== undefined ? [source] : [],
  );

const ONE_ELECTION_GAP =
  "Part IV has room for one election, and the instructions do not say how a second disposed activity is reported.";

/* Lines 19 to 21 for the one election; a second is a gap. */
const electionRule =
  (pick: (carryover: Carryover) => unknown): Rule =>
  (_, info) => {
    const elections = electionsOf(info);
    if (elections.length > 1) return unsupported(ONE_ELECTION_GAP);
    return elections.length === 1 ? pick(elections[0]) : undefined;
  };

const description = (carryover: Carryover) =>
  splitDescription(carryover.basisIncreaseElection?.propertyDescription ?? "");

const PART_IV: Record<string, Rule> = {
  // Line 18: the box is checked for an election, as federal Form 8582-CR line 38.
  "1.line.18_elect_increase_basis_credit_property": (_, info) => electionsOf(info).length > 0,
  "1.line.19_name_of_activity_disposed": electionRule((carryover) => carryover.activity?.name),
  "1.line.20_credit_property_description_row1": electionRule(
    (carryover) => description(carryover)[0],
  ),
  "1.line.20_credit_property_description_row2": electionRule(
    (carryover) => description(carryover)[1],
  ),
  // "Amount of unallowed credit that reduced the property's basis for California purposes" (the face).
  "1.line.21_unallowed_credit_reduced_basis": electionRule((carryover) =>
    roundDollars(carryover.basisIncreaseElection?.amount),
  ),
};

export const form3801CRBindings = (): Record<string, Rule> => ({
  "0.header.name": (_, info) => namesOnReturn(info),
  // A joint return shows the SSN listed first on Form 540, the taxpayer's.
  "0.header.taxpayer_id_number": (_, info) => info.taxpayerSSN,
  ...Object.fromEntries(LINE_FIELDS.map(([fieldId, line]) => [fieldId, lineRule(line)])),
  ...PART_IV,
});

export function register(): void {
  defineForm<Form3801CR, Form3801CRInfo>("form-3801-cr", {
    bindings: form3801CRBindings() as never,
    formatters: {
      "0.header.taxpayer_id_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
