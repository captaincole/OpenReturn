/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { SSN } from "../../values.js";
import type { Form8379FilingInfo } from "./filingInfo.js";
import { FORM_TAX_YEAR, type PartOneLine } from "./lines.js";
import { partOneBox, partOneOf } from "./partOne.js";
import { columnsOf, PART_III_LINES, type Columns, type PartThreeLine } from "./partThree.js";
import {
  differentAddress,
  injuredBox,
  mailingAddress,
  nameShown,
  refundInBothNames,
  ssnShown,
} from "./partTwo.js";
import type { Form8379 } from "./types.js";

type Fn = BindingFn<Form8379, Form8379FilingInfo, keyof Form8379>;
type Bindings = Partial<{ [K in keyof Form8379]: BindingFn<Form8379, Form8379FilingInfo, K> }>;

/* MANUAL EDIT: the Yes and No boxes of Part I lines 2 to 9 (partOne.ts). */
const PART_I_BOXES: Record<PartOneLine, string> = {
  2: "0.line.2_filed_joint_return",
  3: "0.line.3_overpayment_spouse_debt",
  4: "0.line.4_obligated_past_due",
  5: "0.line.5_community_property_resident",
  6: "0.line.6_made_reported_payments",
  7: "0.line.7_had_earned_income",
  8: "0.line.8_claimed_eic_actc",
  9: "0.line.9_claimed_refundable_credit",
};

function partOneBindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (const [line, field] of Object.entries(PART_I_BOXES)) {
    const number = Number(line) as PartOneLine;
    out[`${field}_yes`] = (form, info) => partOneBox(form, info, number, true);
    out[`${field}_no`] = (form, info) => partOneBox(form, info, number, false);
  }
  return out as Bindings;
}

/*
 * MANUAL EDIT: the Yes boxes that send Part I to Part II. With none checked,
 * Part I ended at "Stop here. Do not file this form", and the form leaves the
 * return (irs-8379-face-2025::sec::face-part-i::b02, ::b03).
 */
const TO_PART_II = [5, 6, 8, 9].map((line) => `form-8379.${PART_I_BOXES[line as PartOneLine]}_yes`);

/* MANUAL EDIT: Part III, three columns per line (partThree.ts). */
const PART_III_FIELDS: Record<PartThreeLine, string> = {
  "13a": "1.line.13a_income_w2",
  "13b": "1.line.13b_all_other_income",
  "14": "1.line.14_adjustments_to_income",
  "15": "1.line.15_standard_or_itemized_deductions",
  "16": "1.line.16_nonrefundable_credits",
  "17": "1.line.17_refundable_credits",
  "18": "1.line.18_other_taxes",
  "19": "1.line.19_federal_income_tax_withheld",
  "20": "1.line.20_payments",
};

function partThreeBindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (const line of PART_III_LINES) {
    for (const column of ["a", "b", "c"] as Array<keyof Columns>) {
      out[`${PART_III_FIELDS[line]}_col_${column}`] = (form, info) => {
        const columns = columnsOf(form, info, line);
        return columns === undefined || "unsupported" in columns ? columns : columns[column];
      };
    }
  }
  return out as Bindings;
}

/*
 * MANUAL EDIT: Part IV, "Complete this part only if you are filing Form 8379
 * by itself and not with your tax return" (irs-8379-face-2025::sec::face-part-iv::b01).
 * The engine attaches the form to the joint return, so the part stays blank.
 */
const FILED_WITH_RETURN = (): undefined => undefined;

export function register(): void {
  defineForm<Form8379, Form8379FilingInfo>("form-8379", {
    bindings: {
      "0.line.1_tax_year_filing_for": () => FORM_TAX_YEAR,
      ...partOneBindings(),
      // MANUAL EDIT: line 5's states, when line 5 is answered Yes.
      "0.line.5_community_property_states": (form, info) => {
        const filled = partOneOf(form, info);
        if (filled === undefined || "unsupported" in filled) return filled;
        const states = info.form8379?.fact?.communityPropertyStates ?? [];
        return filled.answers[5] === true ? states.join(", ") : undefined;
      },
      "0.line.10_first_spouse_injured": (_, info) => injuredBox(info, "first"),
      "0.line.10_first_spouse_name": (_, info) => nameShown(info, "first"),
      "0.line.10_first_spouse_ssn": (_, info) => ssnShown(info, "first"),
      "0.line.10_second_spouse_injured": (_, info) => injuredBox(info, "second"),
      "0.line.10_second_spouse_name": (_, info) => nameShown(info, "second"),
      "0.line.10_second_spouse_ssn": (_, info) => ssnShown(info, "second"),
      "0.line.11_refund_in_both_names": (_, info) => refundInBothNames(info),
      "0.line.12_different_mailing_address_yes": (_, info) => differentAddress(info, true),
      "0.line.12_different_mailing_address_no": (_, info) => differentAddress(info, false),
      "0.line.12_refund_mailing_address": (_, info) => mailingAddress(info),
      ...partThreeBindings(),
      "1.signing.injured_spouse_phone": FILED_WITH_RETURN,
      "1.signing.preparer_self_employed": FILED_WITH_RETURN,
      "1.signing.preparer_name": FILED_WITH_RETURN,
      "1.signing.preparer_ptin": FILED_WITH_RETURN,
      "1.signing.firm_name": FILED_WITH_RETURN,
      "1.signing.firm_ein": FILED_WITH_RETURN,
      "1.signing.firm_address": FILED_WITH_RETURN,
      "1.signing.firm_phone": FILED_WITH_RETURN,
    },

    // The SSN widgets (text, maxLength 11) keep the dashes.
    formatters: {
      "0.line.10_first_spouse_ssn": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.line.10_second_spouse_ssn": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    filesOnlyWithAmountOn: TO_PART_II,
  });
}
