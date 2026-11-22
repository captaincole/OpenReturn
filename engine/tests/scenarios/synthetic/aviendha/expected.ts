/*
 * aviendha — LOCKED expected values, drafted from the engine's
 * output on 2026-11-22 (scripts/draftExpected.ts).
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
  "form-2106": {
    engineFields: {
      // Line 1, Column A (Other Than Meals) — Vehicle expense from line 22 or line 29
      "form-2106.0.line.1_vehicle_expense_col_a": 22531,
      // Line 2, Column A (Other Than Meals) — Parking fees, tolls, and transportation, including t
      "form-2106.0.line.2_parking_tolls_transportation_col_a": 386,
      // Line 3, Column A (Other Than Meals) — Travel expense while away from home overnight, inclu
      "form-2106.0.line.3_travel_expense_overnight_col_a": 2941,
      // Line 4, Column A (Other Than Meals) — Business expenses not included on lines 1 through 3.
      "form-2106.0.line.4_other_business_expenses_col_a": 5610,
      // Line 5, Column B (Meals) — Meals expenses
      "form-2106.0.line.5_meals_expenses_col_b": 1150,
      // Line 6, Column A (Other Than Meals) — Total expenses. In Column A, add lines 1 through 4 a
      "form-2106.0.line.6_total_expenses_col_a": 31468,
      // Line 6, Column B (Meals) — Total expenses. In Column B, enter the amount from line 5
      "form-2106.0.line.6_total_expenses_col_b": 1150,
      // Line 7, Column A (Other Than Meals) — Reimbursements received from employer. Include reimb
      "form-2106.0.line.7_employer_reimbursements_col_a": 863,
      // Line 7, Column B (Meals) — Reimbursements received from employer. Include reimbursements r
      "form-2106.0.line.7_employer_reimbursements_col_b": 337,
      // Line 8, Column A (Other Than Meals) — Subtract line 7 from line 6. If zero or less, enter
      "form-2106.0.line.8_expenses_less_reimbursements_col_a": 30605,
      // Line 8, Column B (Meals) — Subtract line 7 from line 6. If zero or less, enter -0-
      "form-2106.0.line.8_expenses_less_reimbursements_col_b": 813,
      // Line 9, Column A (Other Than Meals) — In Column A, enter the amount from line 8
      "form-2106.0.line.9_deductible_amount_col_a": 30605,
      // Line 9, Column B (Meals) — In Column B, see the instructions for the amount to enter
      "form-2106.0.line.9_deductible_amount_col_b": 407,
      // Line 10 — Add the amounts on line 9 for both columns and enter the total here
      "form-2106.0.line.10_total_employee_business_expenses": 31012,
      // Line 12 — Total miles the vehicle was driven during 2025, (a) Vehicle 1
      "form-2106.1.line.12_total_miles_driven_col_a": 18000,
      // Line 12 — Total miles the vehicle was driven during 2025, (b) Vehicle 2
      "form-2106.1.line.12_total_miles_driven_col_b": 9000,
      // Line 13 — Business miles included on line 12, (a) Vehicle 1
      "form-2106.1.line.13_business_miles_col_a": 13500,
      // Line 13 — Business miles included on line 12, (b) Vehicle 2
      "form-2106.1.line.13_business_miles_col_b": 4500,
      // Line 15 — Average daily roundtrip commuting distance, (a) Vehicle 1
      "form-2106.1.line.15_daily_commuting_distance_col_a": 12,
      // Line 15 — Average daily roundtrip commuting distance, (b) Vehicle 2
      "form-2106.1.line.15_daily_commuting_distance_col_b": 8,
      // Line 16 — Commuting miles included on line 12, (a) Vehicle 1
      "form-2106.1.line.16_commuting_miles_col_a": 2640,
      // Line 16 — Commuting miles included on line 12, (b) Vehicle 2
      "form-2106.1.line.16_commuting_miles_col_b": 1200,
      // Line 17 — Other miles. Add lines 13 and 16 and subtract the total from line 12, (a) Vehicl
      "form-2106.1.line.17_other_miles_col_a": 1860,
      // Line 17 — Other miles. Add lines 13 and 16 and subtract the total from line 12, (b) Vehicl
      "form-2106.1.line.17_other_miles_col_b": 3300,
      // Line 23 — Gasoline, oil, repairs, vehicle insurance, etc., (a) Vehicle 1
      "form-2106.1.line.23_gasoline_oil_repairs_insurance_col_a": 4850,
      // Line 23 — Gasoline, oil, repairs, vehicle insurance, etc., (b) Vehicle 2
      "form-2106.1.line.23_gasoline_oil_repairs_insurance_col_b": 2100,
      // Line 24a — Vehicle rentals, (b) Vehicle 2
      "form-2106.1.line.24a_vehicle_rentals_col_b": 5400,
      // Line 24b — Inclusion amount, (b) Vehicle 2
      "form-2106.1.line.24b_inclusion_amount_col_b": 15,
      // Line 24c — Subtract line 24b from line 24a, (b) Vehicle 2
      "form-2106.1.line.24c_net_vehicle_rentals_col_b": 5385,
      // Line 26 — Add lines 23, 24c, and 25, (a) Vehicle 1
      "form-2106.1.line.26_total_actual_expenses_col_a": 4850,
      // Line 26 — Add lines 23, 24c, and 25, (b) Vehicle 2
      "form-2106.1.line.26_total_actual_expenses_col_b": 7485,
      // Line 27 — Multiply line 26 by the percentage on line 14, (a) Vehicle 1
      "form-2106.1.line.27_business_share_expenses_col_a": 3638,
      // Line 27 — Multiply line 26 by the percentage on line 14, (b) Vehicle 2
      "form-2106.1.line.27_business_share_expenses_col_b": 3743,
      // Line 28 — Depreciation, (a) Vehicle 1
      "form-2106.1.line.28_depreciation_col_a": 15150,
      // Line 29 — Add lines 27 and 28, (a) Vehicle 1
      "form-2106.1.line.29_total_vehicle_expenses_col_a": 18788,
      // Line 29 — Add lines 27 and 28, (b) Vehicle 2
      "form-2106.1.line.29_total_vehicle_expenses_col_b": 3743,
      // Line 30 — Enter cost or other basis, (a) Vehicle 1
      "form-2106.1.line.30_cost_or_other_basis_col_a": 34000,
      // Line 31 — Enter section 179 deduction and special allowance, (a) Vehicle 1
      "form-2106.1.line.31_section_179_special_allowance_col_a": 15150,
      // Line 32 — Multiply line 30 by line 14, (a) Vehicle 1
      "form-2106.1.line.32_business_basis_col_a": 10350,
      // Line 34 — Multiply line 32 by the percentage on line 33, (a) Vehicle 1
      "form-2106.1.line.34_depreciation_before_limit_col_a": 2070,
      // Line 35 — Add lines 31 and 34, (a) Vehicle 1
      "form-2106.1.line.35_total_depreciation_section_179_col_a": 17220,
      // Line 36 — Enter the applicable limit explained in the line 36 instructions, (a) Vehicle 1
      "form-2106.1.line.36_applicable_limit_col_a": 20200,
      // Line 37 — Multiply line 36 by the percentage on line 14, (a) Vehicle 1
      "form-2106.1.line.37_business_share_limit_col_a": 15150,
      // Line 38 — Enter the smaller of line 35 or line 37, (a) Vehicle 1
      "form-2106.1.line.38_allowed_depreciation_col_a": 15150,
    },
    renderedText: {
      "form-2106.0.header.taxpayer_name": "Aviendha Thornwell",
      "form-2106.0.header.occupation": "County constable (fee basis)",
      "form-2106.0.header.ssn_first_3_digits": "400",
      "form-2106.0.header.ssn_middle_2_digits": "00",
      "form-2106.0.header.ssn_last_4_digits": "2106",
      "form-2106.1.line.11_date_placed_in_service_month_col_a": "03",
      "form-2106.1.line.11_date_placed_in_service_day_col_a": "14",
      "form-2106.1.line.11_date_placed_in_service_year_col_a": "2025",
      "form-2106.1.line.11_date_placed_in_service_year_col_b": "2024",
      "form-2106.1.line.14_percent_business_use_col_a": "75.00",
      "form-2106.1.line.14_percent_business_use_col_b": "50.00",
      "form-2106.1.line.33_depreciation_method_percentage_col_a": "200 DB 20%",
    },
    // Lines 18–21 all Yes; line 22 blank (no standard-mileage vehicle); column (b) is leased: no Section D.
    renderedChecked: [
      "form-2106.1.line.18_available_personal_use_yes",
      "form-2106.1.line.19_another_vehicle_personal_use_yes",
      "form-2106.1.line.20_evidence_support_deduction_yes",
      "form-2106.1.line.21_evidence_written_yes",
    ],
    renderedBlank: [
      "form-2106.1.line.18_available_personal_use_no",
      "form-2106.1.line.21_evidence_written_no",
      "form-2106.1.line.22_standard_mileage_rate_amount",
      "form-2106.1.line.24a_vehicle_rentals_col_a",
      "form-2106.1.line.28_depreciation_col_b",
      "form-2106.1.line.30_cost_or_other_basis_col_b",
    ],
  },
  "schedule-1": {
    engineFields: {
      // Line 12 — Certain business expenses of reservists, performing artists, and fee-basis gover
      "schedule-1.1.line.12": 26344,
      // Line 26 — Adjustments to income. Add lines 11 through 23 and 25
      "schedule-1.1.line.26": 26344,
    },
  },
  "schedule-a": {
    engineFields: {
      // Line 5b — State and local real estate taxes (see instructions)
      "schedule-a.0.line.5b_real_estate_taxes": 3900,
      // Line 5d — Add lines 5a through 5c
      "schedule-a.0.line.5d_total_state_local_taxes": 3900,
      // Line 5e — Enter the smaller of line 5d or $40,000 ($20,000 if married filing separately)
      "schedule-a.0.line.5e_salt_cap": 3900,
      // Line 7 — Add lines 5e and 6
      "schedule-a.0.line.7_total_taxes": 3900,
      // Line 8a — Home mortgage interest and points reported to you on Form 1098
      "schedule-a.0.line.8a_mortgage_interest_form1098": 11200,
      // Line 8e — Add lines 8a through 8c
      "schedule-a.0.line.8e_total_mortgage_interest_points": 11200,
      // Line 10 — Add lines 8e and 9
      "schedule-a.0.line.10_total_interest": 11200,
      // Line 16 — Other itemized deductions. List type and amount (amount field)
      "schedule-a.0.line.16_other_itemized_deductions_amount": 4668,
      // Line 17 — Total Itemized Deductions. Add the amounts in the far right column for lines 4 t
      "schedule-a.0.line.17_total_itemized_deductions": 19768,
    },
    renderedText: {
      "schedule-a.0.line.16_other_itemized_deductions_description":
        "Impairment-Related Work Expenses 4,668",
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 64000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 64000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 64000,
      // Line 10 — Adjustments to income from Schedule 1, line 26
      "form-1040.line.10": 26344,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 37656,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 37656,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 19768,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 19768,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 17888,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 1907,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 1907,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 1907,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 1907,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 6800,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 6800,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 6800,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 4893,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 4893,
    },
  },
};

export function aviendhaExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
