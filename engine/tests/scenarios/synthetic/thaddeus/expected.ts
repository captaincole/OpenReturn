/*
 * thaddeus — LOCKED expected values, drafted from the engine's
 * output on 2026-11-21 (scripts/draftExpected.ts).
 *
 * UNVERIFIED: no CPA return or filed-return check stands behind these
 * values. They are engine output, checked by hand, so a failure means
 * "the engine changed", not "the engine is wrong".
 *
 * Edit by hand. Change a value only after you verify it against the form
 * instructions or a filed return (scripts/compareFiled).
 */

import type { ExpectedResults } from "../../../types.js";

const EXPECTED: Record<string, Partial<ExpectedResults>> = {
  "form-8853": {
    engineFields: {
      // Line 2 — Archer MSA contributions you made for 2025, including those made in 2026 by the u
      "form-8853.0.line.2_archer_msa_contributions": 2200,
      // Line 3 — Limitation from the Line 3 Limitation Chart and Worksheet in the instructions
      "form-8853.0.line.3_limitation": 2340,
      // Line 4 — Compensation from the employer maintaining the high deductible health plan
      "form-8853.0.line.4_compensation": 142000,
      // Line 5 — Archer MSA deduction. Enter the smallest of line 2, 3, or 4 here
      "form-8853.0.line.5_archer_msa_deduction": 2200,
      // Line 6a — Total distributions you and your spouse received in 2025 from all Archer MSAs
      "form-8853.0.line.6a_total_archer_msa_distributions": 7850,
      // Line 6b — Distributions included on line 6a that you rolled over to another Archer MSA or
      "form-8853.0.line.6b_rollovers_excess_withdrawn": 1000,
      // Line 6c — Subtract line 6b from line 6a
      "form-8853.0.line.6c_net_distributions": 6850,
      // Line 7 — Unreimbursed qualified medical expenses
      "form-8853.0.line.7_archer_qualified_medical_expenses": 3950,
      // Line 8 — Taxable Archer MSA distributions. Subtract line 7 from line 6c. If zero or less,
      "form-8853.0.line.8_taxable_archer_msa_distributions": 2900,
      // Line 9b — Additional 20% tax. Enter 20% (0.20) of the distributions included on line 8 tha
      "form-8853.0.line.9b_additional_20_tax": 340,
      // Line 10 — Total distributions you received in 2025 from all Medicare Advantage MSAs
      "form-8853.0.line.10_total_medicare_advantage_distributions": 7000,
      // Line 11 — Unreimbursed qualified medical expenses
      "form-8853.0.line.11_medicare_advantage_medical_expenses": 4100,
      // Line 12 — Taxable Medicare Advantage MSA distributions. Subtract line 11 from line 10. If
      "form-8853.0.line.12_taxable_medicare_advantage_distributions": 2900,
      // Line 13b — Additional 50% tax. Enter 50% (0.50) of the distributions included on line 12 t
      "form-8853.0.line.13b_additional_50_tax": 850,
      // Line 17 — Gross LTC payments received on a per diem or other periodic basis
      "form-8853.1.line.17_gross_ltc_per_diem_payments": 48000,
      // Line 18 — Enter the part of the amount on line 17 that is from qualified LTC insurance con
      "form-8853.1.line.18_qualified_ltc_contract_payments": 48000,
      // Line 19 — Accelerated death benefits received on a per diem or other periodic basis
      "form-8853.1.line.19_accelerated_death_benefits": 6000,
      // Line 20 — Add lines 18 and 19
      "form-8853.1.line.20_total_per_diem_payments": 54000,
      // Line 21 — Multiply $420 by the number of days in the LTC period
      "form-8853.1.line.21_per_day_limit_amount": 50400,
      // Line 22 — Costs incurred for qualified LTC services provided for the insured during the LT
      "form-8853.1.line.22_qualified_ltc_service_costs": 30000,
      // Line 23 — Enter the larger of line 21 or line 22
      "form-8853.1.line.23_larger_of_line_21_or_22": 50400,
      // Line 24 — Reimbursements for qualified LTC services provided for the insured during the LT
      "form-8853.1.line.24_ltc_service_reimbursements": 6000,
      // Line 25 — Per diem limitation. Subtract line 24 from line 23
      "form-8853.1.line.25_per_diem_limitation": 44400,
      // Line 26 — Taxable payments. Subtract line 25 from line 20. If zero or less, enter -0-
      "form-8853.1.line.26_taxable_payments": 9600,
    },
    renderedText: {
      "form-8853.0.header.taxpayer_name": "Thaddeus Brightwater & Marguerite Brightwater",
      // Both spouses have an MSA: the SSN shown first on the return.
      "form-8853.0.header.msa_account_holder_ssn": "400-00-8853",
      "form-8853.1.header.policyholder_name": "Marguerite Brightwater",
      "form-8853.1.header.policyholder_ssn": "400-00-8854",
      "form-8853.1.line.14a_insured_name": "Ilse Varnholt",
      "form-8853.1.line.14b_insured_ssn": "400-00-8855",
    },
    renderedChecked: [
      "form-8853.0.line.9a_exception_additional_20_tax",
      "form-8853.0.line.13a_exception_additional_50_tax",
      "form-8853.1.line.15_other_person_received_payments_no",
      "form-8853.1.line.16_insured_terminally_ill_no",
    ],
    // No W-2 shows box 12 code R; one Section C.
    renderedBlank: [
      "form-8853.0.line.1_employer_contributions",
      "form-8853.1.header.more_than_one_section_c",
      "form-8853.1.line.15_other_person_received_payments_yes",
      "form-8853.1.line.16_insured_terminally_ill_yes",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 8e — Income from Form 8853
      "schedule-1.0.line.8e": 15400,
      // Line 9 — Total other income. Add lines 8a through 8z
      "schedule-1.0.line.9": 15400,
      // Line 10 — Combine lines 1 through 7 and 9. This is your additional income
      "schedule-1.0.line.10": 15400,
      // Line 23 — Archer MSA deduction
      "schedule-1.1.line.23": 2200,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 2200,
    },
  },
  "schedule-2": {
    engineFields: {
      // Line 17e — Additional tax on Archer MSA distributions. Attach Form 8853
      "schedule-2.1.line.17e_additional_tax_archer_msa_distributions": 340,
      // Line 17f — Additional tax on Medicare Advantage MSA distributions. Attach Form 8853
      "schedule-2.1.line.17f_additional_tax_medicare_advantage_msa_distributions": 850,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 1190,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 1190,
    },
  },
  "schedule-1-a": {
    engineFields: {
      "schedule-1-a.0.line.1_agi_form_1040": 155200,
      "schedule-1-a.0.line.3_modified_agi": 155200,
      "schedule-1-a.1.line.31_magi_from_line_3": 155200,
      "schedule-1-a.1.line.32_senior_threshold": 150000,
      "schedule-1-a.1.line.33_magi_over_threshold": 5200,
      // 6% of 5,200 = 312.
      "schedule-1-a.1.line.34_senior_phaseout": 312,
      "schedule-1-a.1.line.35_senior_amount_per_person": 5688,
      // Marguerite, born 1957, is 65 or older; Thaddeus is not.
      "schedule-1-a.1.line.36b_senior_deduction_spouse": 5688,
      "schedule-1-a.1.line.37_enhanced_senior_deduction": 5688,
      "schedule-1-a.1.line.38_total_additional_deductions": 5688,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 142000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 142000,
      // Line 8 — Additional income from Schedule 1, line 10
      "form-1040.line.8": 15400,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 157400,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 2200,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 155200,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 155200,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 33100,
      // Line 13b — Additional deductions from Schedule 1-A, line 38
      "form-1040.line.13b": 5688,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 38788,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 116412,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 15439,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 15439,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 15439,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 1190,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 16629,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 21000,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 21000,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 21000,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4371,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4371,
    },
  },
};

export function thaddeusExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
