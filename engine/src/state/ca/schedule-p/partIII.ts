/*
 * Schedule P (540) Part III, the credit rows. Each row holds one credit; the
 * engine has no credit facts, so every row is `unsupported` with its reason.
 * Lines 1–3, 11, 22 and 25 (the tax balances) are bound in bindings.ts.
 * Rules: ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01 (a row is
 * completed only for a credit taken) and ::sec::column-a-through-column-d-instructions::b01.
 */

import type { ScheduleP } from "./types.js";

type Unsupported = Partial<Record<keyof ScheduleP, string>>;

function row(reason: string, ...keys: Array<keyof ScheduleP>): Array<[keyof ScheduleP, string]> {
  return keys.map((key) => [key, reason]);
}

const NO_CREDIT_FACTS = "no credit facts";

/* Section A2 (lines 6–9) and B2 (lines 16–19): credits with carryover, named by code (Credit Table). */
function codedCreditRow(page: 2 | 3, line: 6 | 7 | 8 | 9 | 16 | 17 | 18 | 19, section: string) {
  const reason = `${section} line ${line}, a credit with carryover provisions chosen from the Credit Table — ${NO_CREDIT_FACTS}.`;
  const key = (suffix: string) => `${page}.part3.${line}_${suffix}` as keyof ScheduleP;
  return row(
    reason,
    key("credit_code"),
    key("credit_name"),
    key("credit_amount_col_a"),
    key("credit_used_col_b"),
    key("tax_balance_col_c"),
    key("credit_carryover_col_d"),
  );
}

export const partIIICreditRows: Unsupported = Object.fromEntries([
  ...row(
    `Section A1 line 4, prison inmate labor credit (FTB 3507) — ${NO_CREDIT_FACTS}.`,
    "1.part3.4_prison_inmate_labor_credit_col_a",
    "1.part3.4_prison_inmate_labor_credit_col_b",
    "1.part3.4_prison_inmate_labor_credit_col_c",
  ),
  ...row(
    `Section A1 line 5, nonrefundable child and dependent care expenses credit (FTB 3506) — ${NO_CREDIT_FACTS}.`,
    "1.part3.5_child_dependent_care_credit_col_a",
    "1.part3.5_child_dependent_care_credit_col_b",
    "1.part3.5_child_dependent_care_credit_col_c",
  ),
  ...codedCreditRow(2, 6, "Section A2"),
  ...codedCreditRow(2, 7, "Section A2"),
  ...codedCreditRow(2, 8, "Section A2"),
  ...codedCreditRow(2, 9, "Section A2"),
  ...row(
    `Section A2 line 10, credit for prior year AMT (FTB 3510) — no prior-year AMT credit carryover fact.`,
    "2.part3.10_prior_year_amt_credit_amount_col_a",
    "2.part3.10_prior_year_amt_credit_used_col_b",
    "2.part3.10_prior_year_amt_tax_balance_col_c",
    "2.part3.10_prior_year_amt_credit_carryover_col_d",
  ),
  ...row(
    `Section B1 line 12, joint custody head of household credit — ${NO_CREDIT_FACTS}.`,
    "2.part3.12_joint_custody_hoh_credit_amount_col_a",
    "2.part3.12_joint_custody_hoh_credit_used_col_b",
    "2.part3.12_joint_custody_hoh_tax_balance_col_c",
  ),
  ...row(
    `Section B1 line 13, dependent parent credit — ${NO_CREDIT_FACTS}.`,
    "2.part3.13_dependent_parent_credit_amount_col_a",
    "2.part3.13_dependent_parent_credit_used_col_b",
    "2.part3.13_dependent_parent_tax_balance_col_c",
  ),
  ...row(
    `Section B1 line 14, senior head of household credit — ${NO_CREDIT_FACTS}.`,
    "2.part3.14_senior_hoh_credit_amount_col_a",
    "2.part3.14_senior_hoh_credit_used_col_b",
    "2.part3.14_senior_hoh_tax_balance_col_c",
  ),
  ...row(
    `Section B1 line 15, nonrefundable renter's credit — ${NO_CREDIT_FACTS}.`,
    "2.part3.15_renters_credit_amount_col_a",
    "2.part3.15_renters_credit_used_col_b",
    "2.part3.15_renters_tax_balance_col_c",
  ),
  ...codedCreditRow(3, 16, "Section B2"),
  ...codedCreditRow(3, 17, "Section B2"),
  ...codedCreditRow(3, 18, "Section B2"),
  ...codedCreditRow(3, 19, "Section B2"),
  ...row(
    `Section B3 line 20, other state tax credit (Schedule S) — ${NO_CREDIT_FACTS}.`,
    "3.part3.20_other_state_tax_credit_amount_col_a",
    "3.part3.20_other_state_tax_credit_used_col_b",
    "3.part3.20_other_state_tax_tax_balance_col_c",
  ),
  ...row(
    `Section B4 line 21, pass-through entity elective tax credit (FTB 3804-CR) — ${NO_CREDIT_FACTS}.`,
    "3.part3.21_pte_elective_tax_credit_amount_col_a",
    "3.part3.21_pte_elective_tax_credit_used_col_b",
    "3.part3.21_pte_elective_tax_tax_balance_col_c",
    "3.part3.21_pte_elective_tax_credit_carryover_col_d",
  ),
  ...row(
    `Section C line 23, solar energy credit carryover — ${NO_CREDIT_FACTS}.`,
    "3.part3.23_solar_energy_carryover_credit_amount_col_a",
    "3.part3.23_solar_energy_carryover_credit_used_col_b",
    "3.part3.23_solar_energy_carryover_tax_balance_col_c",
    "3.part3.23_solar_energy_carryover_credit_carryover_col_d",
  ),
  ...row(
    `Section C line 24, commercial solar energy credit carryover — ${NO_CREDIT_FACTS}.`,
    "3.part3.24_commercial_solar_carryover_credit_amount_col_a",
    "3.part3.24_commercial_solar_carryover_credit_used_col_b",
    "3.part3.24_commercial_solar_carryover_tax_balance_col_c",
    "3.part3.24_commercial_solar_carryover_credit_carryover_col_d",
  ),
]);
