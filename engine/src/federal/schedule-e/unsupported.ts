/*
 * Page 2 lines the engine has no facts for (MANUAL EDIT): Parts II–IV, line 40
 * and line 42. Lines 41 and 43 are bound (totals.ts).
 */

import type { ScheduleE } from "./types.js";

const PART_II =
  "Part II (partnerships and S corporations) is not modeled: no fact gives a Schedule K-1 (Form 1065 or 1120-S).";
const PART_III =
  "Part III (estates and trusts) is not modeled: no fact gives a Schedule K-1 (Form 1041).";
const PART_IV = "Part IV (REMICs) is not modeled: no fact gives a Schedule Q (Form 1066).";
const FORM_4835 = "Line 40 is not modeled: no fact gives Form 4835 farm rental income.";
const FARMING_FISHING =
  "Line 42 is not modeled: no fact gives Form 4835 or Schedule K-1 farming or fishing income.";

const PART_II_FIELDS: ReadonlyArray<keyof ScheduleE> = [
  "1.line.27_yes",
  "1.line.27_no",
  "1.line.28_row_a_col_a_name",
  "1.line.28_row_a_col_b_entity_type",
  "1.line.28_row_a_col_c_foreign_partnership",
  "1.line.28_row_a_col_d_ein",
  "1.line.28_row_a_col_e_basis_computation_required",
  "1.line.28_row_a_col_f_amount_not_at_risk",
  "1.line.28_row_b_col_a_name",
  "1.line.28_row_b_col_b_entity_type",
  "1.line.28_row_b_col_c_foreign_partnership",
  "1.line.28_row_b_col_d_ein",
  "1.line.28_row_b_col_e_basis_computation_required",
  "1.line.28_row_b_col_f_amount_not_at_risk",
  "1.line.28_row_c_col_a_name",
  "1.line.28_row_c_col_b_entity_type",
  "1.line.28_row_c_col_c_foreign_partnership",
  "1.line.28_row_c_col_d_ein",
  "1.line.28_row_c_col_e_basis_computation_required",
  "1.line.28_row_c_col_f_amount_not_at_risk",
  "1.line.28_row_d_col_a_name",
  "1.line.28_row_d_col_b_entity_type",
  "1.line.28_row_d_col_c_foreign_partnership",
  "1.line.28_row_d_col_d_ein",
  "1.line.28_row_d_col_e_basis_computation_required",
  "1.line.28_row_d_col_f_amount_not_at_risk",
  "1.line.28_row_a_col_g_passive_loss_allowed",
  "1.line.28_row_a_col_h_passive_income",
  "1.line.28_row_a_col_i_nonpassive_loss_allowed",
  "1.line.28_row_a_col_j_section_179_deduction",
  "1.line.28_row_a_col_k_nonpassive_income",
  "1.line.28_row_b_col_g_passive_loss_allowed",
  "1.line.28_row_b_col_h_passive_income",
  "1.line.28_row_b_col_i_nonpassive_loss_allowed",
  "1.line.28_row_b_col_j_section_179_deduction",
  "1.line.28_row_b_col_k_nonpassive_income",
  "1.line.28_row_c_col_g_passive_loss_allowed",
  "1.line.28_row_c_col_h_passive_income",
  "1.line.28_row_c_col_i_nonpassive_loss_allowed",
  "1.line.28_row_c_col_j_section_179_deduction",
  "1.line.28_row_c_col_k_nonpassive_income",
  "1.line.28_row_d_col_g_passive_loss_allowed",
  "1.line.28_row_d_col_h_passive_income",
  "1.line.28_row_d_col_i_nonpassive_loss_allowed",
  "1.line.28_row_d_col_j_section_179_deduction",
  "1.line.28_row_d_col_k_nonpassive_income",
  "1.line.29a_totals_col_h",
  "1.line.29a_totals_col_k",
  "1.line.29b_totals_col_g",
  "1.line.29b_totals_col_i",
  "1.line.29b_totals_col_j",
  "1.line.30_add_income_columns",
  "1.line.31_add_loss_columns",
  "1.line.32_total_partnership_s_corp_income",
];
const PART_III_FIELDS: ReadonlyArray<keyof ScheduleE> = [
  "1.line.33_row_a_col_a_name",
  "1.line.33_row_a_col_b_ein",
  "1.line.33_row_b_col_a_name",
  "1.line.33_row_b_col_b_ein",
  "1.line.33_row_a_col_c_passive_deduction_allowed",
  "1.line.33_row_a_col_d_passive_income",
  "1.line.33_row_a_col_e_nonpassive_deduction_loss",
  "1.line.33_row_a_col_f_other_income",
  "1.line.33_row_b_col_c_passive_deduction_allowed",
  "1.line.33_row_b_col_d_passive_income",
  "1.line.33_row_b_col_e_nonpassive_deduction_loss",
  "1.line.33_row_b_col_f_other_income",
  "1.line.34a_totals_col_d",
  "1.line.34a_totals_col_f",
  "1.line.34b_totals_col_c",
  "1.line.34b_totals_col_e",
  "1.line.35_add_income_columns",
  "1.line.36_add_loss_columns",
  "1.line.37_total_estate_trust_income",
];
const PART_IV_FIELDS: ReadonlyArray<keyof ScheduleE> = [
  "1.line.38_col_a_name",
  "1.line.38_col_b_ein",
  "1.line.38_col_c_excess_inclusion",
  "1.line.38_col_d_taxable_income",
  "1.line.38_col_e_schedules_q_income",
  "1.line.39_remic_income_combined",
];
const FORM_4835_FIELDS: ReadonlyArray<keyof ScheduleE> = ["1.line.40_net_farm_rental_income"];
const FARMING_FISHING_FIELDS: ReadonlyArray<keyof ScheduleE> = [
  "1.line.42_farming_fishing_reconciliation",
];

export const UNSUPPORTED: Partial<Record<keyof ScheduleE, string>> = Object.fromEntries([
  ...PART_II_FIELDS.map((field) => [field, PART_II]),
  ...PART_III_FIELDS.map((field) => [field, PART_III]),
  ...PART_IV_FIELDS.map((field) => [field, PART_IV]),
  ...FORM_4835_FIELDS.map((field) => [field, FORM_4835]),
  ...FARMING_FISHING_FIELDS.map((field) => [field, FARMING_FISHING]),
]);
