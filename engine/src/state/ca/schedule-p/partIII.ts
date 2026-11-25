/*
 * Schedule P (540) Part III, the credit rows. Each row holds one credit. Line 5
 * (FTB 3506), line 10 (FTB 3510), line 20 (Schedule S) and line 21 (FTB
 * 3804-CR) have facts; every other row is `unsupported` with its reason.
 * Lines 1–3, 11, 22 and 25 (the tax balances) are bound in bindings.ts.
 * Rules: ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01 (a row is
 * completed only for a credit taken) and ::sec::column-a-through-column-d-instructions::b01.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported as Gap } from "../../../types.js";
import { PTE_CREDIT_AVAILABLE, files3804Cr } from "../3804-cr/creditUsed.js";
import { scheduleCreditRow, type CreditRow } from "../3804-cr/lines.js";
import { filesScheduleS, otherStateCreditTotal } from "../schedule-s/returnAmounts.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";
import type { ScheduleP } from "./types.js";

type Unsupported = Partial<Record<keyof ScheduleP, string>>;
type Bindings = Partial<{ [K in keyof ScheduleP]: BindingFn<ScheduleP, SchedulePFilingInfo, K> }>;
type Form = FormAccessor<ScheduleP>;

/*
 * Section A1 line 5, the child and dependent care expenses credit (FTB 3506
 * line 12). Column (b) is the smaller of column (a) and the previous line's
 * column (c): line 4's when that credit is taken, else line 3. Column (c) is
 * that balance less column (b) (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01,
 * ::section-a1-instructions::b01). Line 3 at 0 leaves column (b) at 0: the
 * credit "may not" be taken (::section-a-instructions::b01). Blank with no credit.
 */
const openingBalance = (form: Form) =>
  numberOrBlank(form["1.part3.4_prison_inmate_labor_credit_col_c"]) ??
  numberOrBlank(form["1.part3.3_excess_tax_offset_by_credits_col_c"]);

function creditUsed(form: Form): number | undefined {
  const credit = numberOrBlank(form["1.part3.5_child_dependent_care_credit_col_a"]);
  const balance = openingBalance(form);
  return credit === undefined || balance === undefined ? undefined : Math.min(credit, balance);
}

export const childCareCreditRow: Bindings = {
  "1.part3.5_child_dependent_care_credit_col_a": (form) => {
    const credit = numberOrBlank(form["form-3506.0.line.12_child_dependent_care_credit"]);
    return credit !== undefined && credit > 0 ? credit : undefined;
  },
  "1.part3.5_child_dependent_care_credit_col_b": (form) => creditUsed(form),
  "1.part3.5_child_dependent_care_credit_col_c": (form) => {
    const used = creditUsed(form);
    const balance = openingBalance(form);
    return used === undefined || balance === undefined ? undefined : balance - used;
  },
};

/*
 * Section A2 line 10, the credit for prior year AMT (FTB 3510). Column (a) is
 * FTB 3510 line 32 when above 0, and column (b) its line 38
 * (ca-3510-inst-2025::sec::specific-line-instructions::b04, and the form's
 * line 38). Column (c) is the previous line's column (c) less column (b), and
 * column (d) is column (a) less column (b)
 * (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * Blank with no credit.
 */
const SECTION_A_BALANCES = [
  "2.part3.9_tax_balance_col_c",
  "2.part3.8_tax_balance_col_c",
  "2.part3.7_tax_balance_col_c",
  "2.part3.6_tax_balance_col_c",
  "1.part3.5_child_dependent_care_credit_col_c",
  "1.part3.4_prison_inmate_labor_credit_col_c",
  "1.part3.3_excess_tax_offset_by_credits_col_c",
] as const;

const priorYearAmtCredit = (form: Form) => {
  const credit = numberOrBlank(form["form-3510.0.line.32_combine_lines_30_and_31"]);
  return credit !== undefined && credit > 0 ? credit : undefined;
};

function priorYearAmtCreditUsed(form: Form): number | undefined {
  if (priorYearAmtCredit(form) === undefined) return undefined;
  return numberOrBlank(form["form-3510.0.line.38_prior_year_amt_credit"]);
}

export const priorYearAmtCreditRow: Bindings = {
  "2.part3.10_prior_year_amt_credit_amount_col_a": (form) => priorYearAmtCredit(form),
  "2.part3.10_prior_year_amt_credit_used_col_b": (form) => priorYearAmtCreditUsed(form),
  "2.part3.10_prior_year_amt_tax_balance_col_c": (form) => {
    const used = priorYearAmtCreditUsed(form);
    if (used === undefined) return undefined;
    const balance = SECTION_A_BALANCES.map((id) => numberOrBlank(form[id])).find(
      (amount) => amount !== undefined,
    );
    return balance === undefined ? undefined : balance - used;
  },
  "2.part3.10_prior_year_amt_credit_carryover_col_d": (form) => {
    const credit = priorYearAmtCredit(form);
    const used = priorYearAmtCreditUsed(form);
    return credit === undefined || used === undefined ? undefined : credit - used;
  },
};

/*
 * Section B3 line 20, the other state tax credit: column (a) is the total of
 * every Schedule S line 12 (ca-540-sched-p-inst-2025::sec::section-b3-instructions::b01).
 * Column (b) is the smaller of column (a) and the previous line's column (c):
 * the last Section B line with a balance, else line 11. Column (c) is that
 * balance less column (b) (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * The credit has no carryover: there is no column (d). With no Schedule S the
 * row stays unsupported; with a credit of 0 it is blank (no credit taken).
 */
const NO_SCHEDULE_S = unsupported(
  "Section B3 line 20, other state tax credit (Schedule S) — no credit facts.",
);
const SECTION_B_BALANCES: Array<keyof ScheduleP> = [
  "3.part3.19_tax_balance_col_c",
  "3.part3.18_tax_balance_col_c",
  "3.part3.17_tax_balance_col_c",
  "3.part3.16_tax_balance_col_c",
  "2.part3.15_renters_tax_balance_col_c",
  "2.part3.14_senior_hoh_tax_balance_col_c",
  "2.part3.13_dependent_parent_tax_balance_col_c",
  "2.part3.12_joint_custody_hoh_tax_balance_col_c",
  "2.part3.11_tax_balance_col_c",
];

function balanceBeforeLine20(form: Form): number | undefined {
  for (const id of SECTION_B_BALANCES) {
    const balance = numberOrBlank(form[id]);
    if (balance !== undefined) return balance;
  }
  return undefined;
}

function otherStateCredit(form: Form, info: SchedulePFilingInfo) {
  const total = otherStateCreditTotal((fieldId) => form[fieldId], info);
  return total === 0 ? undefined : total;
}

function otherStateCreditUsed(form: Form, info: SchedulePFilingInfo): number | undefined {
  const credit = numberOrBlank(otherStateCredit(form, info));
  const balance = balanceBeforeLine20(form);
  return credit === undefined || balance === undefined ? undefined : Math.min(credit, balance);
}

export const otherStateCreditRow: Bindings = {
  "3.part3.20_other_state_tax_credit_amount_col_a": (form, info) =>
    filesScheduleS(info) ? otherStateCredit(form, info) : NO_SCHEDULE_S,
  "3.part3.20_other_state_tax_credit_used_col_b": (form, info) =>
    filesScheduleS(info) ? otherStateCreditUsed(form, info) : NO_SCHEDULE_S,
  "3.part3.20_other_state_tax_tax_balance_col_c": (form, info) => {
    if (!filesScheduleS(info)) return NO_SCHEDULE_S;
    const used = otherStateCreditUsed(form, info);
    const balance = balanceBeforeLine20(form);
    return used === undefined || balance === undefined ? undefined : balance - used;
  },
};

/*
 * Section B4 line 21, the PTE elective tax credit: column (a) is FTB 3804-CR
 * line 3 (ca-540-sched-p-inst-2025::sec::section-b4-instructions::b01). The
 * credit "should be applied against the net tax after the other state tax
 * credit" (::pass-through-entity-pte-elective-tax-credit::b01), so the balance
 * before it is line 20 column (c) when that credit is taken, else the last
 * Section B balance. Columns (b) to (d) follow the column rules (3804-cr/lines.ts).
 * With no FTB 3804-CR the row stays unsupported; with line 3 at 0 it is blank.
 */
const NO_3804_CR = unsupported(
  "Section B4 line 21, pass-through entity elective tax credit (FTB 3804-CR) — no credit facts.",
);

function balanceBeforeLine21(form: Form, info: SchedulePFilingInfo): number | undefined {
  if (filesScheduleS(info)) {
    const total = otherStateCreditTotal((fieldId) => form[fieldId], info);
    if (typeof total !== "number") return undefined;
    if (total > 0) return numberOrBlank(form["3.part3.20_other_state_tax_tax_balance_col_c"]);
  }
  return balanceBeforeLine20(form);
}

function pteCreditRow(form: Form, info: SchedulePFilingInfo) {
  const available = numberOrBlank(form[PTE_CREDIT_AVAILABLE]);
  if (available === undefined || available <= 0) return undefined;
  const balance = balanceBeforeLine21(form, info);
  return balance === undefined ? undefined : scheduleCreditRow(available, balance);
}

const pteColumn =
  (pick: (row: CreditRow) => number) =>
  (form: Form, info: SchedulePFilingInfo): number | Gap | undefined => {
    if (!files3804Cr(info)) return NO_3804_CR;
    const credit = pteCreditRow(form, info);
    return credit === undefined ? undefined : pick(credit);
  };

export const pteCreditRowBindings: Bindings = {
  "3.part3.21_pte_elective_tax_credit_amount_col_a": pteColumn((row) => row.available),
  "3.part3.21_pte_elective_tax_credit_used_col_b": pteColumn((row) => row.used),
  "3.part3.21_pte_elective_tax_tax_balance_col_c": pteColumn((row) => row.balance),
  "3.part3.21_pte_elective_tax_credit_carryover_col_d": pteColumn((row) => row.carryover),
};

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
  ...codedCreditRow(2, 6, "Section A2"),
  ...codedCreditRow(2, 7, "Section A2"),
  ...codedCreditRow(2, 8, "Section A2"),
  ...codedCreditRow(2, 9, "Section A2"),
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
