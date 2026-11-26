/*
 * Page 2 lines the engine does not fill (MANUAL EDIT): Part IV. Parts II and
 * III and line 41 are bound (partII.ts, partIII.ts), lines 40 and 42 from Form
 * 4835 (farmRental.ts), line 43 too (totals.ts).
 */

import type { ScheduleE } from "./types.js";

const PART_IV = "Part IV (REMICs) is not modeled: no fact gives a Schedule Q (Form 1066).";

const PART_IV_FIELDS: ReadonlyArray<keyof ScheduleE> = [
  "1.line.38_col_a_name",
  "1.line.38_col_b_ein",
  "1.line.38_col_c_excess_inclusion",
  "1.line.38_col_d_taxable_income",
  "1.line.38_col_e_schedules_q_income",
  "1.line.39_remic_income_combined",
];

export const UNSUPPORTED: Partial<Record<keyof ScheduleE, string>> = Object.fromEntries(
  PART_IV_FIELDS.map((field) => [field, PART_IV]),
);
