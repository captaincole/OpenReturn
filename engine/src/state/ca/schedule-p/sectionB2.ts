/*
 * Schedule P (540) Part III, Section B2 lines 16 to 18: the California passive
 * credits that FTB 3801-CR allows, one code a line ("Do not enter the same
 * credit code or name on more than one line within a section",
 * ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01). The low-income
 * housing (172), research (183) and orphan drug (185) credits offset tax in
 * Section B2 (ca-540-sched-p-inst-2025::sec::credit-table::b02, ::b03, ::b06).
 * Columns (a) to (d) follow the column rules (3804-cr/lines.ts,
 * scheduleCreditRow). A line with no passive credit keeps its reason: the
 * other Section B2 credits have no facts.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { isGap } from "../../../federal/3800/cells.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import {
  passiveCreditsAllowed,
  SECTION_B2_LINES,
  type PassiveCreditTaken,
} from "../3801-cr/creditUsed.js";
import type { Form3801CRInfo } from "../3801-cr/filingInfo.js";
import { scheduleCreditRow, type CreditRow } from "../3804-cr/lines.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";
import type { ScheduleP } from "./types.js";

type Info = SchedulePFilingInfo & Form3801CRInfo;
type Bindings = Partial<{ [K in keyof ScheduleP]: BindingFn<ScheduleP, Info, K> }>;
type Form = FormAccessor<ScheduleP>;
type SectionB2Line = (typeof SECTION_B2_LINES)[number];

/* The reason a line keeps when it has no passive credit: the one it had before. */
export const noCreditReason = (line: number) =>
  `Section B2 line ${line}, a credit with carryover provisions chosen from the Credit Table — no credit facts.`;

/* Section B1 lines 12 to 15, bottom up, then line 11: the balance before line 16. */
const BALANCES_BEFORE_B2: Array<keyof ScheduleP> = [
  "2.part3.15_renters_tax_balance_col_c",
  "2.part3.14_senior_hoh_tax_balance_col_c",
  "2.part3.13_dependent_parent_tax_balance_col_c",
  "2.part3.12_joint_custody_hoh_tax_balance_col_c",
  "2.part3.11_tax_balance_col_c",
];

function balanceBeforeB2(form: Form): number | undefined {
  for (const id of BALANCES_BEFORE_B2) {
    const balance = numberOrBlank(form[id]);
    if (balance !== undefined) return balance;
  }
  return undefined;
}

/* Each passive credit's row in order: column (b) of a row is the smaller of (a) and the previous (c). */
function sectionB2Rows(
  form: Form,
  info: Info,
): Array<{ credit: PassiveCreditTaken; row: CreditRow }> | Unsupported | undefined {
  const credits = passiveCreditsAllowed((fieldId) => form[fieldId], info);
  if (credits === undefined || isGap(credits)) return credits;
  let balance = balanceBeforeB2(form);
  if (balance === undefined) return credits.length === 0 ? [] : undefined;
  return credits.map((credit) => {
    const row = scheduleCreditRow(credit.allowed, balance as number);
    balance = row.balance;
    return { credit, row };
  });
}

/* One field of line `line`: the passive credit's value, else the line's reason. */
const column =
  (line: SectionB2Line, pick: (credit: PassiveCreditTaken, row: CreditRow) => unknown) =>
  (form: Form, info: Info) => {
    const index = SECTION_B2_LINES.indexOf(line);
    const allowed = passiveCreditsAllowed((fieldId) => form[fieldId], info);
    if (allowed === undefined || isGap(allowed)) return allowed;
    if (allowed.length <= index) return unsupported(noCreditReason(line));
    const rows = sectionB2Rows(form, info);
    if (rows === undefined || isGap(rows)) return rows;
    return pick(rows[index].credit, rows[index].row);
  };

function lineBindings(line: SectionB2Line): Bindings {
  const key = (suffix: string) => `3.part3.${line}_${suffix}`;
  return {
    [key("credit_code")]: column(line, (credit) => credit.code),
    [key("credit_name")]: column(line, (credit) => credit.name),
    [key("credit_amount_col_a")]: column(line, (_, row) => row.available),
    [key("credit_used_col_b")]: column(line, (_, row) => row.used),
    [key("tax_balance_col_c")]: column(line, (_, row) => row.balance),
    [key("credit_carryover_col_d")]: column(line, (_, row) => row.carryover),
  } as Bindings;
}

export const sectionB2PassiveCreditRows: Bindings = Object.assign(
  {},
  ...SECTION_B2_LINES.map(lineBindings),
);
