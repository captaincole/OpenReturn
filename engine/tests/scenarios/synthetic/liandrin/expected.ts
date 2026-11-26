/*
 * liandrin — LOCKED expected values, drafted from the engine's
 * output on 2026-11-26 (scripts/draftExpected.ts).
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
  "form-4255": {
    engineFields: {
      // Line 1a — Form 7207 — (a) Credit or deduction claimed in prior year(s) (as adjusted, if ap
      "form-4255.0.part1.1a_form_7207_col_a": 20000,
      // Line 1a — Form 7207 — (b) Gross elective payment election (EPE) amount portion of column (
      "form-4255.0.part1.1a_form_7207_col_b": 20000,
      // Line 1a — Form 7207 — (c) Gross EPE amount in column (b) applied against regular tax (sect
      "form-4255.0.part1.1a_form_7207_col_c": 5000,
      // Line 1a — Form 7207 — (d) Net EPE amount. Subtract column (c) from column (b)
      "form-4255.0.part1.1a_form_7207_col_d": 15000,
      // Line 1b — Form 3468, Part III — (a) Credit or deduction claimed in prior year(s) (as adjus
      "form-4255.0.part1.1b_form_3468_part_iii_col_a": 32000,
      // Line 1b — Form 3468, Part III — (e) Non-EPE credit (excess of column (a) over column (b))
      "form-4255.0.part1.1b_form_3468_part_iii_col_e": 24000,
      // Line 1b — Form 3468, Part III — (f) Carryover. Subtract the sum of columns (b) and (e) fro
      "form-4255.0.part1.1b_form_3468_part_iii_col_f": 8000,
      // Line 1b — Form 3468, Part III — (h) Amount of column (a) recaptured, including reduction o
      "form-4255.0.part1.1b_form_3468_part_iii_col_h": 19200,
      // Line 1b — Form 3468, Part III — (i) Portion of column (h) reducing credit carryover in col
      "form-4255.0.part1.1b_form_3468_part_iii_col_i": 4800,
      // Line 1c — Form 7210 — (a) Credit or deduction claimed in prior year(s) (as adjusted, if ap
      "form-4255.0.part1.1c_form_7210_col_a": 8000,
      // Line 1c — Form 7210 — (b) Gross elective payment election (EPE) amount portion of column (
      "form-4255.0.part1.1c_form_7210_col_b": 8000,
      // Line 1c — Form 7210 — (d) Net EPE amount. Subtract column (c) from column (b)
      "form-4255.0.part1.1c_form_7210_col_d": 8000,
      // Line 1d — Form 3468, Part IV — (a) Credit or deduction claimed in prior year(s) (as adjust
      "form-4255.0.part1.1d_form_3468_part_iv_col_a": 10000,
      // Line 1d — Form 3468, Part IV — (b) Gross elective payment election (EPE) amount portion of
      "form-4255.0.part1.1d_form_3468_part_iv_col_b": 10000,
      // Line 1d — Form 3468, Part IV — (d) Net EPE amount. Subtract column (c) from column (b)
      "form-4255.0.part1.1d_form_3468_part_iv_col_d": 10000,
      // Line 1d — Form 3468, Part IV — (h) Amount of column (a) recaptured, including reduction of
      "form-4255.0.part1.1d_form_3468_part_iv_col_h": 10000,
      // Line 1j — Form 3468, Part VI — (a) Credit or deduction claimed in prior year(s) (as adjust
      "form-4255.0.part1.1j_form_3468_part_vi_col_a": 132000,
      // Line 1j — Form 3468, Part VI — (e) Non-EPE credit (excess of column (a) over column (b)) t
      "form-4255.0.part1.1j_form_3468_part_vi_col_e": 97000,
      // Line 1j — Form 3468, Part VI — (f) Carryover. Subtract the sum of columns (b) and (e) from
      "form-4255.0.part1.1j_form_3468_part_vi_col_f": 35000,
      // Line 1j — Form 3468, Part VI — (h) Amount of column (a) recaptured, including reduction of
      "form-4255.0.part1.1j_form_3468_part_vi_col_h": 27350,
      // Line 2a — Form 8933 — (a) Credit or deduction claimed in prior year(s) (as adjusted, if ap
      "form-4255.0.part1.2a_form_8933_col_a": 60000,
      // Line 2a — Form 8933 — (b) Gross elective payment election (EPE) amount portion of column (
      "form-4255.0.part1.2a_form_8933_col_b": 50000,
      // Line 2a — Form 8933 — (d) Net EPE amount. Subtract column (c) from column (b)
      "form-4255.0.part1.2a_form_8933_col_d": 50000,
      // Line 2a — Form 8933 — (f) Carryover. Subtract the sum of columns (b) and (e) from column (
      "form-4255.0.part1.2a_form_8933_col_f": 10000,
      // Line 2a — Form 8933 — (h) Amount of column (a) recaptured, including reduction of carryove
      "form-4255.0.part1.2a_form_8933_col_h": 9000,
      // Line 2b — Form 8911 — (a) Credit or deduction claimed in prior year(s) (as adjusted, if ap
      "form-4255.0.part1.2b_form_8911_col_a": 18000,
      // Line 2b — Form 8911 — (e) Non-EPE credit (excess of column (a) over column (b)) that was a
      "form-4255.0.part1.2b_form_8911_col_e": 18000,
      // Line 2b — Form 8911 — (h) Amount of column (a) recaptured, including reduction of carryove
      "form-4255.0.part1.2b_form_8911_col_h": 3600,
      // Line 3 — Total — (a) Credit or deduction claimed in prior year(s) (as adjusted, if applica
      "form-4255.0.part1.3_total_col_a": 280000,
      // Line 3 — Total — (b) Gross elective payment election (EPE) amount portion of column (a)
      "form-4255.0.part1.3_total_col_b": 88000,
      // Line 3 — Total — (c) Gross EPE amount in column (b) applied against regular tax (section 3
      "form-4255.0.part1.3_total_col_c": 5000,
      // Line 3 — Total — (d) Net EPE amount. Subtract column (c) from column (b)
      "form-4255.0.part1.3_total_col_d": 83000,
      // Line 3 — Total — (e) Non-EPE credit (excess of column (a) over column (b)) that was applie
      "form-4255.0.part1.3_total_col_e": 139000,
      // Line 3 — Total — (f) Carryover. Subtract the sum of columns (b) and (e) from column (a)
      "form-4255.0.part1.3_total_col_f": 53000,
      // Line 3 — Total — (h) Amount of column (a) recaptured, including reduction of carryover
      "form-4255.0.part1.3_total_col_h": 69150,
      // Line 3 — Total — (i) Portion of column (h) reducing credit carryover in column (f)
      "form-4255.0.part1.3_total_col_i": 4800,
      // Line 1a, column (n)(1) — Form 7207: If you owe an EP related to a gross EPE in column (b),
      "form-4255.1.part1.1a_form_7207_col_n1": 2000,
      // Line 1a, column (n)(3) — Form 7207: If you owe an EP, enter any 20% EP you owe
      "form-4255.1.part1.1a_form_7207_col_n3": 400,
      // Line 1b, column (j) — Form 3468, Part III: Portion of column (h) recapturing non-EPE credi
      "form-4255.1.part1.1b_form_3468_part_iii_col_j": 14400,
      // Line 1c, column (n)(1) — Form 7210: If you owe an EP related to a gross EPE in column (b),
      "form-4255.1.part1.1c_form_7210_col_n1": 1000,
      // Line 1c, column (n)(2) — Form 7210: If you owe an EP, enter the portion of the EP not in c
      "form-4255.1.part1.1c_form_7210_col_n2": 500,
      // Line 1c, column (n)(3) — Form 7210: If you owe an EP, enter any 20% EP you owe
      "form-4255.1.part1.1c_form_7210_col_n3": 300,
      // Line 1d, column (l) — Form 3468, Part IV: Portion of column (h) recapturing net EPE amount
      "form-4255.1.part1.1d_form_3468_part_iv_col_l": 10000,
      // Line 1d, column (n)(1) — Form 3468, Part IV: If you owe an EP related to a gross EPE in co
      "form-4255.1.part1.1d_form_3468_part_iv_col_n1": 500,
      // Line 1d, column (n)(3) — Form 3468, Part IV: If you owe an EP, enter any 20% EP you owe
      "form-4255.1.part1.1d_form_3468_part_iv_col_n3": 100,
      // Line 1j, column (j) — Form 3468, Part VI: Portion of column (h) recapturing non-EPE credit
      "form-4255.1.part1.1j_form_3468_part_vi_col_j": 27350,
      // Line 1j, column (m)(1) — Form 3468, Part VI: Section 6418(g)(2)(A)(i) excessive credit tra
      "form-4255.1.part1.1j_form_3468_part_vi_col_m1": 5000,
      // Line 1j, column (m)(2) — Form 3468, Part VI: Section 6418(g)(2)(A)(ii) 20% of excessive cr
      "form-4255.1.part1.1j_form_3468_part_vi_col_m2": 1000,
      // Line 1j, column (m)(3) — Form 3468, Part VI: Section 6418(g)(3) credit transfer recapture
      "form-4255.1.part1.1j_form_3468_part_vi_col_m3": 2000,
      // Line 2a, column (l) — Form 8933: Portion of column (h) recapturing net EPE amount from col
      "form-4255.1.part1.2a_form_8933_col_l": 9000,
      // Line 2a, column (n)(1) — Form 8933: If you owe an EP related to a gross EPE in column (b),
      "form-4255.1.part1.2a_form_8933_col_n1": 4000,
      // Line 2a, column (n)(2) — Form 8933: If you owe an EP, enter the portion of the EP not in c
      "form-4255.1.part1.2a_form_8933_col_n2": 1000,
      // Line 2a, column (n)(3) — Form 8933: If you owe an EP, enter any 20% EP you owe
      "form-4255.1.part1.2a_form_8933_col_n3": 1000,
      // Line 2b, column (j) — Form 8911: Portion of column (h) recapturing non-EPE credit applied
      "form-4255.1.part1.2b_form_8911_col_j": 3600,
      // Line 3, column (j) — Total: Portion of column (h) recapturing non-EPE credit applied again
      "form-4255.1.part1.3_total_col_j": 45350,
      // Line 3, column (l) — Total: Portion of column (h) recapturing net EPE amount from column (
      "form-4255.1.part1.3_total_col_l": 19000,
      // Line 3, column (m)(1) — Total: Section 6418(g)(2)(A)(i) excessive credit transfer
      "form-4255.1.part1.3_total_col_m1": 5000,
      // Line 3, column (m)(2) — Total: Section 6418(g)(2)(A)(ii) 20% of excessive credit transfer
      "form-4255.1.part1.3_total_col_m2": 1000,
      // Line 3, column (m)(3) — Total: Section 6418(g)(3) credit transfer recapture
      "form-4255.1.part1.3_total_col_m3": 2000,
      // Line 3, column (n)(1) — Total: If you owe an EP related to a gross EPE in column (b), ente
      "form-4255.1.part1.3_total_col_n1": 7500,
      // Line 3, column (n)(2) — Total: If you owe an EP, enter the portion of the EP not in column
      "form-4255.1.part1.3_total_col_n2": 1500,
      // Line 3, column (n)(3) — Total: If you owe an EP, enter any 20% EP you owe
      "form-4255.1.part1.3_total_col_n3": 1800,
      // Line 1a — Form 7207, column (q): Amount that can be reduced by nonrefundable credits
      "form-4255.2.part1.1a_form_7207_col_q": 2400,
      // Line 1a — Form 7207, column (s): Add columns (l) and (n)(1)
      "form-4255.2.part1.1a_form_7207_col_s": 2000,
      // Line 1a — Form 7207, column (t): Add columns (n)(3), (o)(1), (o)(2), (p)(1), and (p)(2)
      "form-4255.2.part1.1a_form_7207_col_t": 400,
      // Line 1b — Form 3468, Part III, column (r): Amount that cannot be reduced by nonrefundable
      "form-4255.2.part1.1b_form_3468_part_iii_col_r": 14400,
      // Line 1c — Form 7210, column (q): Amount that can be reduced by nonrefundable credits
      "form-4255.2.part1.1c_form_7210_col_q": 1800,
      // Line 1c — Form 7210, column (s): Add columns (l) and (n)(1)
      "form-4255.2.part1.1c_form_7210_col_s": 1000,
      // Line 1c — Form 7210, column (t): Add columns (n)(3), (o)(1), (o)(2), (p)(1), and (p)(2)
      "form-4255.2.part1.1c_form_7210_col_t": 300,
      // Line 1d — Form 3468, Part IV, column (q): Amount that can be reduced by nonrefundable cred
      "form-4255.2.part1.1d_form_3468_part_iv_col_q": 600,
      // Line 1d — Form 3468, Part IV, column (r): Amount that cannot be reduced by nonrefundable c
      "form-4255.2.part1.1d_form_3468_part_iv_col_r": 10000,
      // Line 1d — Form 3468, Part IV, column (s): Add columns (l) and (n)(1)
      "form-4255.2.part1.1d_form_3468_part_iv_col_s": 10500,
      // Line 1d — Form 3468, Part IV, column (t): Add columns (n)(3), (o)(1), (o)(2), (p)(1), and
      "form-4255.2.part1.1d_form_3468_part_iv_col_t": 100,
      // Line 1j — Form 3468, Part VI, column (p)(3): Apprenticeship penalty amounts not related to
      "form-4255.2.part1.1j_form_3468_part_vi_col_p3": 1200,
      // Line 1j — Form 3468, Part VI, column (q): Amount that can be reduced by nonrefundable cred
      "form-4255.2.part1.1j_form_3468_part_vi_col_q": 6000,
      // Line 1j — Form 3468, Part VI, column (r): Amount that cannot be reduced by nonrefundable c
      "form-4255.2.part1.1j_form_3468_part_vi_col_r": 30550,
      // Line 2a — Form 8933, column (o)(1): Prevailing wage penalty amounts related to a net EPE a
      "form-4255.2.part1.2a_form_8933_col_o1": 2500,
      // Line 2a — Form 8933, column (o)(3): Prevailing wage penalty amounts not related to an EPE
      "form-4255.2.part1.2a_form_8933_col_o3": 500,
      // Line 2a — Form 8933, column (q): Amount that can be reduced by nonrefundable credits
      "form-4255.2.part1.2a_form_8933_col_q": 15000,
      // Line 2a — Form 8933, column (r): Amount that cannot be reduced by nonrefundable credits
      "form-4255.2.part1.2a_form_8933_col_r": 3000,
      // Line 2a — Form 8933, column (s): Add columns (l) and (n)(1)
      "form-4255.2.part1.2a_form_8933_col_s": 13000,
      // Line 2a — Form 8933, column (t): Add columns (n)(3), (o)(1), (o)(2), (p)(1), and (p)(2)
      "form-4255.2.part1.2a_form_8933_col_t": 3500,
      // Line 2b — Form 8911, column (q): Amount that can be reduced by nonrefundable credits
      "form-4255.2.part1.2b_form_8911_col_q": 3600,
      // Line 3 — Total, column (o)(1): Prevailing wage penalty amounts related to a net EPE amount
      "form-4255.2.part1.3_total_col_o1": 2500,
      // Line 3 — Total, column (o)(3): Prevailing wage penalty amounts not related to an EPE amoun
      "form-4255.2.part1.3_total_col_o3": 500,
      // Line 3 — Total, column (p)(3): Apprenticeship penalty amounts not related to an EPE amount
      "form-4255.2.part1.3_total_col_p3": 1200,
      // Line 3 — Total, column (q): Amount that can be reduced by nonrefundable credits
      "form-4255.2.part1.3_total_col_q": 29400,
      // Line 3 — Total, column (r): Amount that cannot be reduced by nonrefundable credits
      "form-4255.2.part1.3_total_col_r": 57950,
      // Line 3 — Total, column (s): Add columns (l) and (n)(1)
      "form-4255.2.part1.3_total_col_s": 26500,
      // Line 3 — Total, column (t): Add columns (n)(3), (o)(1), (o)(2), (p)(1), and (p)(2)
      "form-4255.2.part1.3_total_col_t": 4300,
      // Line 2 — Credit base as of the end of the previous tax year (Property A)
      "form-4255.3.part2.2_credit_base_previous_year_col_a": 400000,
      // Line 2 — Credit base as of the end of the previous tax year (Property B)
      "form-4255.3.part2.2_credit_base_previous_year_col_b": 120000,
      // Line 2 — Credit base as of the end of the previous tax year (Property C)
      "form-4255.3.part2.2_credit_base_previous_year_col_c": 40000,
      // Line 2 — Credit base as of the end of the previous tax year (Property D)
      "form-4255.3.part2.2_credit_base_previous_year_col_d": 20000,
      // Line 3 — Net change in nonqualified nonrecourse financing during the tax year (Property B)
      "form-4255.3.part2.3_net_change_nonrecourse_financing_col_b": 20000,
      // Line 4 — Credit base as of the end of the current tax year. Subtract line 3 from line 2 (P
      "form-4255.3.part2.4_credit_base_current_year_col_a": 400000,
      // Line 4 — Credit base as of the end of the current tax year. Subtract line 3 from line 2 (P
      "form-4255.3.part2.4_credit_base_current_year_col_b": 100000,
      // Line 4 — Credit base as of the end of the current tax year. Subtract line 3 from line 2 (P
      "form-4255.3.part2.4_credit_base_current_year_col_c": 40000,
      // Line 4 — Credit base as of the end of the current tax year. Subtract line 3 from line 2 (P
      "form-4255.3.part2.4_credit_base_current_year_col_d": 20000,
      // Line 5 — Refigured credit (Property A)
      "form-4255.3.part2.5_refigured_credit_col_a": 80000,
      // Line 5 — Refigured credit (Property B)
      "form-4255.3.part2.5_refigured_credit_col_b": 30000,
      // Line 5 — Refigured credit (Property C)
      "form-4255.3.part2.5_refigured_credit_col_c": 10000,
      // Line 5 — Refigured credit (Property D)
      "form-4255.3.part2.5_refigured_credit_col_d": 6000,
      // Line 6 — Credit taken for this property on Form 3800 in prior years (Property A)
      "form-4255.3.part2.6_credit_taken_prior_years_col_a": 24000,
      // Line 6 — Credit taken for this property on Form 3800 in prior years (Property B)
      "form-4255.3.part2.6_credit_taken_prior_years_col_b": 36000,
      // Line 6 — Credit taken for this property on Form 3800 in prior years (Property C)
      "form-4255.3.part2.6_credit_taken_prior_years_col_c": 10000,
      // Line 6 — Credit taken for this property on Form 3800 in prior years (Property D)
      "form-4255.3.part2.6_credit_taken_prior_years_col_d": 6000,
      // Line 7 — Credit subject to recapture due to a net increase in nonqualified nonrecourse fin
      "form-4255.3.part2.7_credit_subject_to_recapture_col_b": 6000,
      // Line 8 — Unused general business credits that would have been allowed if original credit h
      "form-4255.3.part2.8_unused_credits_current_base_col_b": 1500,
      // Line 9 — Subtract line 8 from line 7. This is the recapture tax as a result of a net incre
      "form-4255.3.part2.9_recapture_tax_nonrecourse_financing_col_b": 4500,
      // Line 12 — Number of full years between the date on line 10 and the date on line 11 (Proper
      "form-4255.3.part2.12_full_years_in_service_col_a": 2,
      // Line 12 — Number of full years between the date on line 10 and the date on line 11 (Proper
      "form-4255.3.part2.12_full_years_in_service_col_d": 3,
      // Line 13 — Unused general business credits that would have been allowed had there been no c
      "form-4255.3.part2.13_unused_credits_without_property_col_d": 1000,
      // Line 14 — Subtract line 13 from line 6 (Property A)
      "form-4255.3.part2.14_line_6_minus_line_13_col_a": 24000,
      // Line 14 — Subtract line 13 from line 6 (Property C)
      "form-4255.3.part2.14_line_6_minus_line_13_col_c": 10000,
      // Line 14 — Subtract line 13 from line 6 (Property D)
      "form-4255.3.part2.14_line_6_minus_line_13_col_d": 5000,
      // Line 16 — Multiply line 14 by the percentage on line 15 (Property A)
      "form-4255.3.part2.16_recapture_tax_disposition_col_a": 14400,
      // Line 16 — Multiply line 14 by the percentage on line 15 (Property C)
      "form-4255.3.part2.16_recapture_tax_disposition_col_c": 10000,
      // Line 16 — Multiply line 14 by the percentage on line 15 (Property D)
      "form-4255.3.part2.16_recapture_tax_disposition_col_d": 2000,
      // Line 18 — Add property columns A through D, line 9
      "form-4255.3.part2.18_total_line_9_all_properties": 4500,
      // Line 19 — Add property columns A through D, line 16
      "form-4255.3.part2.19_total_line_16_all_properties": 26400,
      // Line 20 — Total increase in tax. Add lines 18 and 19
      "form-4255.3.part2.20_total_increase_in_tax": 30900,
      // Part III, Line 2 — Enter the basis of property placed in service during the tax year from
      "form-4255.4.part3.2_basis_property_placed_in_service": 250000,
      // Part III, Line 4 — Multiply line 2 by line 3
      "form-4255.4.part3.4_basis_times_energy_percentage": 75000,
      // Part III, Line 7 — Multiply line 6 by line 2
      "form-4255.4.part3.7_current_percentage_times_basis": 18750,
      // Part III, Line 8 — Subtract line 7 from line 4
      "form-4255.4.part3.8_credit_difference": 56250,
      // Part III, Line 9 — Multiply line 8 by 20% (0.20). This is the total increase in tax result
      "form-4255.4.part3.9_emissions_tier_recapture_tax": 11250,
      // Part II lines 3 and 7 to 9 print -0- where section 49 does not apply (line-3::b01, the form's line 7).
      "form-4255.3.part2.3_net_change_nonrecourse_financing_col_a": 0,
      "form-4255.3.part2.7_credit_subject_to_recapture_col_a": 0,
      "form-4255.3.part2.9_recapture_tax_nonrecourse_financing_col_d": 0,
      // Line 12 is 0 for an advanced manufacturing expansion (line-12::b01).
      "form-4255.3.part2.12_full_years_in_service_col_c": 0,
    },
    renderedText: {
      "form-4255.0.header.taxpayer_name": "Liandrin Corvesse",
      "form-4255.0.header.identifying_number": "400-00-4255",
      "form-4255.0.part1.1b_form_3468_part_iii_col_g": "60%",
      "form-4255.0.part1.1d_form_3468_part_iv_col_g": "100%",
      // Four events on line 1j: properties B and D, Part III and Worksheet 3.
      "form-4255.0.part1.1j_form_3468_part_vi_col_g": "N/A",
      "form-4255.3.part2.1_original_rate_of_credit_col_a": "20%",
      "form-4255.3.part2.10_date_placed_in_service_col_a": "03/01/2023",
      "form-4255.3.part2.11_date_ceased_to_qualify_col_a": "08/20/2025",
      "form-4255.3.part2.15_recapture_percentage_col_a": "60%",
      "form-4255.3.part2.15_recapture_percentage_col_c": "100%",
      "form-4255.3.part2.15_recapture_percentage_col_d": "40%",
      "form-4255.3.part2.17_irs_registration_number_col_c": "EPE-48D-0425517",
      "form-4255.4.part3.1_designed_emissions_rate": "0.40 kg CO2e/kg H2",
      "form-4255.4.part3.3_energy_percentage_credit_year": "30%",
      "form-4255.4.part3.5_current_year_emissions_rate": "2.10 kg CO2e/kg H2",
      "form-4255.4.part3.6_current_year_energy_percentage": "7.5%",
    },
    renderedBlank: [
      // Section D is blank for property B (no disposition); column (g) of line 2a (no percentage).
      "form-4255.3.part2.10_date_placed_in_service_col_b",
      "form-4255.3.part2.16_recapture_tax_disposition_col_b",
      "form-4255.0.part1.2a_form_8933_col_g",
    ],
  },
  "schedule-2": {
    renderedText: {
      "schedule-2.0.line.1y_other_additions_description": "ARPCR; EPGEPE; 6418(g)(2)",
      "schedule-2.1.line.17a_recapture_other_credits_description": "3468; 6418(g)(3)",
      "schedule-2.1.line.17z_other_taxes_description": "PWA8933; NPWA",
    },
    renderedChecked: [
      "schedule-2.0.line.1e_ep_checkbox_line1a",
      "schedule-2.0.line.1e_ep_checkbox_line1c",
      "schedule-2.0.line.1e_ep_checkbox_line1d",
      "schedule-2.0.line.1e_ep_checkbox_line2a",
      "schedule-2.0.line.1f_20pct_ep_checkbox_line1a",
      "schedule-2.0.line.1f_20pct_ep_checkbox_line1c",
      "schedule-2.0.line.1f_20pct_ep_checkbox_line1d",
      "schedule-2.0.line.1f_20pct_ep_checkbox_line2a",
    ],
    engineFields: {
      // Line 1d — Recapture of net EPE from Form 4255, line 2a, column (l)
      "schedule-2.0.line.1d_recapture_net_epe_form4255": 9000,
      // Line 1e — Excessive payments (EPs) on gross EPE from Form 4255, amount
      "schedule-2.0.line.1e_excessive_payments_epe_amount": 7500,
      // Line 1f — 20% EP from Form 4255, amount
      "schedule-2.0.line.1f_20pct_ep_amount": 1800,
      // Line 1y — Other additions to tax (see instructions), amount
      "schedule-2.0.line.1y_other_additions_amount": 11100,
      // Line 1z — Add lines 1a through 1y
      "schedule-2.0.line.1z_total_lines_1a_through_1y": 29400,
      // Line 3 — Add lines 1z and 2. Enter here and on Form 1040, 1040-SR, or 1040-NR, line 17
      "schedule-2.0.line.3_total_lines_1z_and_2": 29400,
      // Line 11 — Additional Medicare Tax. Attach Form 8959
      "schedule-2.0.line.11_additional_medicare_tax": 2520,
      // Line 17a — Recapture of other credits amount
      "schedule-2.1.line.17a_recapture_other_credits_amount": 43750,
      // Line 17z — Any other taxes amount
      "schedule-2.1.line.17z_other_taxes_amount": 4200,
      // Line 18 — Total additional taxes. Add lines 17a through 17z
      "schedule-2.1.line.18_total_additional_taxes": 47950,
      // Line 19 — Recapture of net EPE from Form 4255, line 1d, column (l)
      "schedule-2.1.line.19_recapture_net_epe_form4255_line1d": 10000,
      // Line 21 — Add lines 4, 7 through 16, 18, and 19. Total other taxes. Enter here and on Form
      "schedule-2.1.line.21_total_other_taxes": 60470,
    },
  },
  "form-8959": {
    engineFields: {
      // Line 1 — Medicare wages and tips from Form W-2, box 5
      "form-8959.0.line.1_medicare_wages_tips": 480000,
      // Line 4 — Add lines 1 through 3
      "form-8959.0.line.4_total_medicare_wages": 480000,
      // Line 5 — Enter the following amount for your filing status (single)
      "form-8959.0.line.5_filing_status_threshold_wages": 200000,
      // Line 6 — Subtract line 5 from line 4
      "form-8959.0.line.6_excess_medicare_wages": 280000,
      // Line 7 — Multiply line 6 by 0.9%: 280,000 × 0.009
      "form-8959.0.line.7_additional_medicare_tax_wages": 2520,
      // Line 18 — Add lines 7, 13, and 17
      "form-8959.0.line.18_total_additional_medicare_tax": 2520,
      // Line 19 — Medicare tax withheld from Form W-2, box 6
      "form-8959.0.line.19_medicare_tax_withheld": 9480,
      // Line 20 — Enter the amount from line 1
      "form-8959.0.line.20_medicare_wages_from_line1": 480000,
      // Line 21 — Multiply line 20 by 1.45%: 480,000 × 0.0145
      "form-8959.0.line.21_regular_medicare_tax_on_wages": 6960,
      // Line 22 — Subtract line 21 from line 19
      "form-8959.0.line.22_additional_medicare_tax_withholding_wages": 2520,
      // Line 24 — Add lines 22 and 23
      "form-8959.0.line.24_total_additional_medicare_tax_withholding": 2520,
    },
  },
  "form-1040": {
    engineFields: {
      // Line 1a — Total amount from Form(s) W-2, box 1
      "form-1040.line.1a": 480000,
      // Line 1z — Add lines 1a through 1h
      "form-1040.line.1z": 480000,
      // Line 9 — Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8. This is your total income
      "form-1040.line.9": 480000,
      // Line 11a — Subtract line 10 from line 9. This is your adjusted gross income
      "form-1040.line.11a": 480000,
      // Line 11b — Amount from line 11a (adjusted gross income)
      "form-1040.line.11b": 480000,
      // Line 12e — Standard deduction or itemized deductions (from Schedule A)
      "form-1040.line.12e": 15750,
      // Line 14 — Add lines 12e, 13a, and 13b
      "form-1040.line.14": 15750,
      // Line 15 — Subtract line 14 from line 11b. Taxable income
      "form-1040.line.15": 464250,
      // Line 16 — Tax (see instructions)
      "form-1040.line.16": 132035,
      // Line 17 — Amount from Schedule 2, line 3
      "form-1040.line.17": 29400,
      // Line 18 — Add lines 16 and 17
      "form-1040.line.18": 161435,
      // Line 22 — Subtract line 21 from line 18. If zero or less, enter -0-
      "form-1040.line.22": 161435,
      // Line 23 — Other taxes, including self-employment tax, from Schedule 2, line 21
      "form-1040.line.23": 60470,
      // Line 24 — Add lines 22 and 23. Total tax
      "form-1040.line.24": 221905,
      // Line 25a — Federal income tax withheld from Form(s) W-2
      "form-1040.line.25a": 230000,
      // Line 25c — Federal income tax withheld from other forms (see instructions)
      "form-1040.line.25c": 2520,
      // Line 25d — Add lines 25a through 25c
      "form-1040.line.25d": 232520,
      // Line 33 — Add lines 25d, 26, and 32. Total payments
      "form-1040.line.33": 232520,
      // Line 34 — If line 33 is more than line 24, the amount you overpaid
      "form-1040.line.34": 10615,
      // Line 35a — Amount of line 34 you want refunded to you
      "form-1040.line.35a": 10615,
    },
  },
};

export function liandrinExpected(formId: string): ExpectedResults {
  const expected = EXPECTED[formId] ?? {};
  return {
    engineFields: expected.engineFields ?? {},
    renderedText: expected.renderedText ?? {},
    renderedBlank: expected.renderedBlank ?? [],
    renderedChecked: expected.renderedChecked ?? [],
  };
}
