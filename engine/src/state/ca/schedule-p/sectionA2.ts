/*
 * Schedule P (540) Part III, Section A2 lines 6 and 7: FTB 3541's original
 * (223) and new (237) motion picture credits, which "cannot reduce regular tax
 * below TMT" (ca-3541-inst-2025::sec::c-limitations::b01) and offset tax in
 * Section A2 (ca-540-sched-p-inst-2025::sec::credit-table::b01, ::b02). Column
 * (b) is the smaller of column (a) and the previous line's column (c): line 5,
 * else line 4, else line 3, the tax over TMT. A line 3 of 0 leaves column (b)
 * at 0 and the whole credit in column (d) (::section-a-instructions::b01).
 * Columns follow ::column-a-through-column-d-instructions::b01 (3804-cr/lines.ts,
 * scheduleCreditRow). A line with no film credit keeps its reason.
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import {
  filmCreditsAvailable,
  SECTION_A2_FILM_LINES,
  type FilmCodeCredit,
} from "../3541/creditUsed.js";
import type { Form3541FilingInfo } from "../3541/filingInfo.js";
import { scheduleCreditRow, type CreditRow } from "../3804-cr/lines.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";
import type { ScheduleP } from "./types.js";

type Info = SchedulePFilingInfo & Form3541FilingInfo;
type Bindings = Partial<{ [K in keyof ScheduleP]: BindingFn<ScheduleP, Info, K> }>;
type Form = FormAccessor<ScheduleP>;
type A2Line = (typeof SECTION_A2_FILM_LINES)[number];

/* The reason a line keeps when it has no film credit: the one it had before. */
const noCreditReason = (line: number) =>
  `Section A2 line ${line}, a credit with carryover provisions chosen from the Credit Table — no credit facts.`;

const BALANCES_BEFORE_A2: Array<keyof ScheduleP> = [
  "1.part3.5_child_dependent_care_credit_col_c",
  "1.part3.4_prison_inmate_labor_credit_col_c",
  "1.part3.3_excess_tax_offset_by_credits_col_c",
];

function balanceBeforeA2(form: Form): number | undefined {
  for (const id of BALANCES_BEFORE_A2) {
    const balance = numberOrBlank(form[id]);
    if (balance !== undefined) return balance;
  }
  return undefined;
}

function sectionA2Credits(info: Info): FilmCodeCredit[] | Unsupported | undefined {
  const credits = filmCreditsAvailable(info);
  if (credits === undefined || !Array.isArray(credits)) return credits;
  return credits.filter((credit) => credit.program.section === "A2");
}

function sectionA2Rows(form: Form, info: Info) {
  const credits = sectionA2Credits(info);
  if (credits === undefined || !Array.isArray(credits)) return credits;
  let balance = balanceBeforeA2(form);
  if (balance === undefined) return undefined;
  return credits.map((credit) => {
    const row = scheduleCreditRow(credit.available, balance as number);
    balance = row.balance;
    return { credit, row };
  });
}

const column =
  (line: A2Line, pick: (credit: FilmCodeCredit, row: CreditRow) => unknown) =>
  (form: Form, info: Info) => {
    const index = SECTION_A2_FILM_LINES.indexOf(line);
    const credits = sectionA2Credits(info);
    if (credits === undefined || !Array.isArray(credits)) return credits;
    if (credits.length <= index) return unsupported(noCreditReason(line));
    const rows = sectionA2Rows(form, info);
    if (rows === undefined || !Array.isArray(rows)) return rows;
    return pick(rows[index].credit, rows[index].row);
  };

function lineBindings(line: A2Line): Bindings {
  const key = (suffix: string) => `2.part3.${line}_${suffix}`;
  return {
    [key("credit_code")]: column(line, (credit) => credit.program.code),
    [key("credit_name")]: column(line, (credit) => credit.program.name),
    [key("credit_amount_col_a")]: column(line, (_, row) => row.available),
    [key("credit_used_col_b")]: column(line, (_, row) => row.used),
    [key("tax_balance_col_c")]: column(line, (_, row) => row.balance),
    [key("credit_carryover_col_d")]: column(line, (_, row) => row.carryover),
  } as Bindings;
}

export const sectionA2FilmCreditRows: Bindings = Object.assign(
  {},
  ...SECTION_A2_FILM_LINES.map(lineBindings),
);
