/*
 * Page 2 lines the engine does not fill (MANUAL EDIT): Part IV, line 40 and
 * line 42. Parts II and III and line 41 are bound (partII.ts, partIII.ts), line
 * 43 too (totals.ts).
 */

import type { ScheduleE } from "./types.js";

const PART_IV = "Part IV (REMICs) is not modeled: no fact gives a Schedule Q (Form 1066).";
const FORM_4835 = "Line 40 is not modeled: no fact gives Form 4835 farm rental income.";
const FARMING_FISHING =
  "Line 42 is not modeled: no fact gives Form 4835 or Schedule K-1 farming or fishing income.";

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
  ...PART_IV_FIELDS.map((field) => [field, PART_IV]),
  ...FORM_4835_FIELDS.map((field) => [field, FORM_4835]),
  ...FARMING_FISHING_FIELDS.map((field) => [field, FARMING_FISHING]),
]);
