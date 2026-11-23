/*
 * Page 2 lines the engine does not fill (MANUAL EDIT): Parts III and IV, line 40
 * and line 42. Part II and line 41 are bound (partII.ts), line 43 too (totals.ts).
 */

import type { ScheduleE } from "./types.js";

const PART_III =
  "Part III (estates and trusts) is not modeled: no item of a Schedule K-1 (Form 1041) has a route yet; line 41 names each one.";
const PART_IV = "Part IV (REMICs) is not modeled: no fact gives a Schedule Q (Form 1066).";
const FORM_4835 = "Line 40 is not modeled: no fact gives Form 4835 farm rental income.";
const FARMING_FISHING =
  "Line 42 is not modeled: no fact gives Form 4835 or Schedule K-1 farming or fishing income.";

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
  ...PART_III_FIELDS.map((field) => [field, PART_III]),
  ...PART_IV_FIELDS.map((field) => [field, PART_IV]),
  ...FORM_4835_FIELDS.map((field) => [field, FORM_4835]),
  ...FARMING_FISHING_FIELDS.map((field) => [field, FARMING_FISHING]),
]);
