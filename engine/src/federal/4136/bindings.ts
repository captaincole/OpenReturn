/*
 * Form 4136, Credit for Federal Tax Paid on Fuels. The header, Part I, the
 * certification boxes, the registration numbers and line 17 are here; the
 * columns of the Part II rows come from one table (tableBindings.ts).
 */

import { defineForm } from "../../defineForm.js";
import type { FuelRegistrationLine } from "../../facts/kinds/fuelTaxCredit.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form4136FilingInfo } from "./filingInfo.js";
import type { PartI } from "./form.js";
import { dollarsAndCents } from "./lines.js";
import type { DyeBox } from "./rows.js";
import {
  centsFormatters,
  tableBindings,
  withForm,
  type Rule,
  type Value,
} from "./tableBindings.js";
import type { Form4136 } from "./types.js";

const SCHEDULE_A =
  "More than one qualifying business activity: each needs its own Schedule A (Form 4136) (irs-4136-inst-2025::sec::part-i::b02), which the engine does not file.";

const fromPartI = (pick: (partI: PartI) => Value): Rule =>
  withForm((result) => (result.partI === undefined ? undefined : pick(result.partI)));

/* The exception box: "If any of the ... fuel included in this claim did contain visible evidence of dye ... check here". */
const dyeBox = (box: DyeBox): Rule =>
  withForm((result) => (result.dyeBoxes.has(box) ? true : undefined));

/* "Registration No.": the Form 637 number of a claimed line (irs-4136-inst-2025::sec::information-for-claims-on-lines-6-8::b01). */
const registration = (line: FuelRegistrationLine): Rule =>
  withForm((result) => result.registrationNumbers[line]);

/* Line 17 waits while a claimed line has no registration number. */
const line17Part = (part: "dollars" | "cents"): Rule =>
  withForm((result) => {
    if (result.missingRegistration || result.line17 === undefined) return undefined;
    return dollarsAndCents(result.line17)[part];
  });

const PART_I: Record<string, Rule> = {
  /*
   * Line A: Yes for a business activity with qualifying use, or for home use of
   * kerosene ("Answer 'Yes' on line A, skip lines B through F",
   * irs-4136-inst-2025::sec::specific-instructions::b01). A form with no claim
   * prints no answer.
   */
  "0.header.a_qualifying_business_activity_yes": withForm((result) =>
    result.carriers.size > 0 ? true : undefined,
  ),
  "0.header.a_qualifying_business_activity_no": withForm((result) =>
    result.carriers.size > 0 ? false : undefined,
  ),
  "0.header.b_number_of_business_activities": fromPartI((partI) =>
    partI.activityCount > 1 ? unsupported(SCHEDULE_A) : partI.activityCount,
  ),
  /*
   * DECISION (2026-11-26, by the author): which business activity Part I lines C
   * to F describe when there is more than one. The form face: "enter information
   * about the business activity generating the most credit below"
   * (irs-4136-face-2025::sec::face-part-i::b01). The instructions: "the business
   * activity ... generating the most qualifying fuel usage"
   * (irs-4136-inst-2025::sec::schedule-a-form-4136-business::b02). The engine
   * follows the form face, the text the signer declares: the most credit, then
   * the most gallons, then the first recorded. No dollars change; and with more
   * than one activity line B is unsupported (Schedule A), so this picks only the
   * printed name.
   */
  "0.header.c_business_name": fromPartI((partI) => partI.name),
  // Line D: the EIN from Form SS-4; "If you don't have an EIN, leave line D blank."
  "0.header.d_business_ein": fromPartI((partI) => partI.ein),
  "0.header.e_principal_business_activity_code": fromPartI((partI) => partI.code),
  "0.header.f_i_equipment_make": fromPartI((partI) => partI.equipment?.make),
  "0.header.f_ii_equipment_model": fromPartI((partI) => partI.equipment?.model),
  "0.header.f_iii_equipment_type": fromPartI((partI) => partI.equipment?.type),
};

const LINE_FIELDS: Record<string, Rule> = {
  "0.line.3_undyed_diesel_dye_exception": dyeBox("3"),
  "1.line.4_kerosene_dye_exception": dyeBox("4"),
  "1.line.6_diesel_vendor_registration_no": registration("6"),
  "1.line.6_diesel_dye_exception": dyeBox("6"),
  "1.line.7_kerosene_vendor_registration_no": registration("7"),
  "1.line.7_kerosene_dye_exception": dyeBox("7"),
  "2.line.8_registration_number": registration("8"),
  "3.line.13_registration_no": registration("13"),
  "3.line.15_registration_no": registration("15"),
  // Line 17: "Add lines 1 through 16, column (e)", with cents (lines.ts).
  "3.line.17_total_income_tax_credit": line17Part("dollars"),
  "3.line.17_total_income_tax_credit_cents": line17Part("cents"),
};

const HEADER: Record<string, Rule> = {
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.taxpayer_identification_number": (_, info) => info.taxpayerSSN,
};

/* Every field's rule: the catalog has no field without one (tests/unit/federal/4136/form.test.ts). */
export const form4136Bindings = (): Record<string, Rule> => ({
  ...HEADER,
  ...PART_I,
  ...LINE_FIELDS,
  ...tableBindings(),
});

const formatSsn = (value: unknown) => SSN.format(value as Parameters<typeof SSN.format>[0]);

export function register(): void {
  defineForm<Form4136, Form4136FilingInfo>("form-4136", {
    bindings: form4136Bindings() as never,
    // The SSN widget keeps the dashes; the numeric cents boxes keep two digits.
    formatters: {
      "0.header.taxpayer_identification_number": formatSsn,
      ...centsFormatters(),
    } as never,
  });
}
