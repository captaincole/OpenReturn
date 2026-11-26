/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form982FilingInfo } from "./filingInfo.js";
import type { Form982Lines } from "./form.js";
import type { Form982 } from "./types.js";

/* A line of the printed form: unsupported with a gap, blank while it waits or when nothing applies. */
function lineOf<T extends number | boolean>(
  pick: (form: Form982Lines) => T | undefined,
): (form: unknown, info: Form982FilingInfo) => T | Unsupported | undefined {
  return (_, info) => {
    if (info.form982Gap) return unsupported(info.form982Gap);
    return info.form982 === undefined ? undefined : pick(info.form982);
  };
}

/*
 * MANUAL EDIT: Part III is the consent of a corporation that excludes income
 * under section 1081(b) (irs-982-inst-2025::sec::part-iii::b01,
 * irs-982-face-2025::sec::face-part-iii::b01). An individual's return never
 * fills it, so its fields stay blank.
 */
const corporationOnly = () => undefined;

export function register(): void {
  defineForm<Form982, Form982FilingInfo>("form-982", {
    bindings: {
      // MANUAL EDIT: the header copies the return's names and the first SSN shown on it.
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: Part I lines 1a–1e, checked for each exclusion with an amount (partOne.ts, form.ts).
      "0.line.1a_title_11_case": lineOf((form) => form.line1a),
      "0.line.1b_insolvency": lineOf((form) => form.line1b),
      "0.line.1c_qualified_farm_indebtedness": lineOf((form) => form.line1c),
      "0.line.1d_qualified_real_property_business": lineOf((form) => form.line1d),
      "0.line.1e_qualified_principal_residence": lineOf((form) => form.line1e),
      // MANUAL EDIT: line 2, the total excluded (irs-982-inst-2025::sec::line-2::b01).
      "0.line.2_total_discharged_excluded": lineOf((form) => form.line2),
      // MANUAL EDIT: line 3, the section 1017(b)(3)(E) election, for "Any other debt" (form.ts asksLine3).
      "0.line.3_elect_real_property_depreciable_yes": lineOf((form) => form.line3Yes),
      "0.line.3_elect_real_property_depreciable_no": lineOf((form) => form.line3No),
      // MANUAL EDIT: Part II, the excluded dollars applied to each attribute (partTwo.ts, form.ts).
      "0.line.4_real_property_business_basis": lineOf((form) => form.line4),
      "0.line.5_elect_depreciable_basis_first": lineOf((form) => form.line5),
      "0.line.6_net_operating_loss": lineOf((form) => form.line6),
      "0.line.7_general_business_credit": lineOf((form) => form.line7),
      "0.line.8_minimum_tax_credit": lineOf((form) => form.line8),
      "0.line.9_net_capital_loss": lineOf((form) => form.line9),
      "0.line.10a_property_basis": lineOf((form) => form.line10a),
      "0.line.10b_principal_residence_basis": lineOf((form) => form.line10b),
      "0.line.11a_farm_depreciable_property": lineOf((form) => form.line11a),
      "0.line.11b_farm_land": lineOf((form) => form.line11b),
      "0.line.11c_farm_other_property": lineOf((form) => form.line11c),
      "0.line.12_passive_activity_carryovers": lineOf((form) => form.line12),
      "0.line.13_foreign_tax_credit": lineOf((form) => form.line13),
      "0.part3.corporation_amount_excluded": corporationOnly,
      "0.part3.tax_year_beginning": corporationOnly,
      "0.part3.tax_year_ending": corporationOnly,
      "0.part3.state_of_incorporation": corporationOnly,
    },

    // The identifying number widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
