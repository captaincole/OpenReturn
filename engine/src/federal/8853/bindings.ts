/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import { SSN, ssnOf } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form8853FilingInfo } from "./filingInfo.js";
import type { Form8853 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form8853]: BindingFn<Form8853, Form8853FilingInfo, K> }>;

/*
 * MANUAL EDIT: every line is figured in the resolver (sectionA.ts, sectionB.ts,
 * sectionC.ts, with the arithmetic in lines.ts); a binding reads its line.
 */
const line =
  <K extends keyof Form8853>(field: K): BindingFn<Form8853, Form8853FilingInfo, K> =>
  (_, info) =>
    info.form8853Lines?.[field] as ReturnType<BindingFn<Form8853, Form8853FilingInfo, K>>;

const LINE_FIELDS: ReadonlyArray<keyof Form8853> = [
  "0.line.1_employer_contributions",
  "0.line.2_archer_msa_contributions",
  "0.line.3_limitation",
  "0.line.4_compensation",
  "0.line.5_archer_msa_deduction",
  "0.line.6a_total_archer_msa_distributions",
  "0.line.6b_rollovers_excess_withdrawn",
  "0.line.6c_net_distributions",
  "0.line.7_archer_qualified_medical_expenses",
  "0.line.8_taxable_archer_msa_distributions",
  "0.line.9a_exception_additional_20_tax",
  "0.line.9b_additional_20_tax",
  "0.line.10_total_medicare_advantage_distributions",
  "0.line.11_medicare_advantage_medical_expenses",
  "0.line.12_taxable_medicare_advantage_distributions",
  "0.line.13a_exception_additional_50_tax",
  "0.line.13b_additional_50_tax",
  "1.line.14a_insured_name",
  "1.line.14b_insured_ssn",
  "1.line.15_other_person_received_payments_yes",
  "1.line.15_other_person_received_payments_no",
  "1.line.16_insured_terminally_ill_yes",
  "1.line.16_insured_terminally_ill_no",
  "1.line.17_gross_ltc_per_diem_payments",
  "1.line.18_qualified_ltc_contract_payments",
  "1.line.19_accelerated_death_benefits",
  "1.line.20_total_per_diem_payments",
  "1.line.21_per_day_limit_amount",
  "1.line.22_qualified_ltc_service_costs",
  "1.line.23_larger_of_line_21_or_22",
  "1.line.24_ltc_service_reimbursements",
  "1.line.25_per_diem_limitation",
  "1.line.26_taxable_payments",
];

const personName = (info: BaseFilingInfo, who: "taxpayer" | "spouse"): string | undefined => {
  const first = who === "spouse" ? info.spouseFirstName : info.taxpayerFirstName;
  const last = who === "spouse" ? info.spouseLastName : info.taxpayerLastName;
  return first && last ? `${first} ${last}` : undefined;
};

const personSsn = (info: BaseFilingInfo, who: "taxpayer" | "spouse"): SSN | undefined =>
  who === "spouse" ? info.spouseSSN : info.taxpayerSSN;

/* The SSN widgets (text, maxLength 11) keep the dashes, as on Form 6781. */
const SSN_FIELDS = [
  "0.header.msa_account_holder_ssn",
  "1.header.policyholder_ssn",
  "1.line.14b_insured_ssn",
] as const;
const withDashes = (value: unknown): string => {
  const digits = ssnOf(typeof value === "string" ? value : undefined);
  return digits === undefined ? String(value) : SSN.format(digits);
};

export function register(): void {
  defineForm<Form8853, Form8853FilingInfo>("form-8853", {
    bindings: {
      // MANUAL EDIT: irs-8853-inst-2025::sec::specific-instructions::b01: the names and the SSN shown on the return.
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.msa_account_holder_ssn": (_, info) =>
        info.form8853MsaHolder === undefined ? undefined : personSsn(info, info.form8853MsaHolder),
      // MANUAL EDIT: Section C names the policyholder on the 1099-LTC (::section-c-long-term-care-ltc::b01).
      "1.header.policyholder_name": (_, info) =>
        info.form8853Policyholder === undefined
          ? undefined
          : personName(info, info.form8853Policyholder),
      "1.header.policyholder_ssn": (_, info) =>
        info.form8853Policyholder === undefined
          ? undefined
          : personSsn(info, info.form8853Policyholder),
      // MANUAL EDIT: the engine prints one Section C, so the box stays unchecked (sectionC.ts marks the other case).
      "1.header.more_than_one_section_c": (_, info) =>
        info.form8853Lines?.["1.header.more_than_one_section_c"],
      ...(Object.fromEntries(LINE_FIELDS.map((field) => [field, line(field)])) as Bindings),
    },
    formatters: Object.fromEntries(SSN_FIELDS.map((field) => [field, withDashes])),
  });
}
