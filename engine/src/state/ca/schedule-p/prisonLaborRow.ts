/*
 * Schedule P (540) Part III, Section A1 line 4: the prison inmate labor credit,
 * code 162 (FTB 3507). Column (a) is FTB 3507 line 5, "the amount of credit
 * available to offset tax"; column (b) is the smaller of column (a) and line 3,
 * the excess tax, and at most the $5,000,000 business credit limit; column (c)
 * is line 3 less column (b) (3507/lines.ts, scheduleARow;
 * ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01,
 * ::section-a1-instructions::b01). Section A1 has no column (d). With no FTB
 * 3507 the row keeps its reason; with line 5 at 0 it is blank.
 *
 * With line 3 at 0 the row is blank too. "If the amount is zero or less than
 * zero, go to question 1": code 162 offsets tax only in Section A1, so "You may
 * not take the credit this year"; and with nothing lost to the $5,000,000
 * limit it has no carryover provision, so "You may not take the credit this
 * year or in future years" (ca-540-sched-p-inst-2025::sec::section-a-instructions::b01).
 * Columns (a) to (d) are completed only "for each line on which you are
 * taking a credit" (ca-540-sched-p-inst-2025::sec::to-complete-part-iii::b01).
 */

import type { BindingFn, FormAccessor } from "../../../defineForm.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import {
  files3507,
  PRISON_LABOR_CREDIT_AVAILABLE,
  prisonLaborReturnGap,
} from "../3507/creditUsed.js";
import type { Form3507FilingInfo } from "../3507/filingInfo.js";
import { scheduleARow, type ScheduleARow } from "../3507/lines.js";
import type { SchedulePFilingInfo } from "./filingInfo.js";
import type { ScheduleP } from "./types.js";

type Info = SchedulePFilingInfo & Form3507FilingInfo;
type Bindings = Partial<{ [K in keyof ScheduleP]: BindingFn<ScheduleP, Info, K> }>;
type Form = FormAccessor<ScheduleP>;

/* The reason the row had before FTB 3507 had rules, word for word. */
const NO_3507 = unsupported(
  "Section A1 line 4, prison inmate labor credit (FTB 3507) — no credit facts.",
);

function row(form: Form): ScheduleARow | undefined {
  const available = numberOrBlank(form[PRISON_LABOR_CREDIT_AVAILABLE]);
  if (available === undefined || available <= 0) return undefined;
  const excess = numberOrBlank(form["1.part3.3_excess_tax_offset_by_credits_col_c"]);
  return excess === undefined || excess <= 0 ? undefined : scheduleARow(available, excess);
}

/*
 * Columns (b) and (c) share FTB 3507 line 6a's gap (a credit through a
 * disregarded SMLLC), so the row never prints a credit used that line 6a
 * cannot figure. Column (a), the credit available, has no gap.
 */
const column =
  (pick: (credit: ScheduleARow) => number, limited = true) =>
  (form: Form, info: Info): number | Unsupported | undefined => {
    if (!files3507(info)) return NO_3507;
    const gap = limited ? prisonLaborReturnGap(info) : undefined;
    if (gap !== undefined) return gap;
    const credit = row(form);
    return credit === undefined ? undefined : pick(credit);
  };

export const prisonLaborCreditRow: Bindings = {
  "1.part3.4_prison_inmate_labor_credit_col_a": column((credit) => credit.available, false),
  "1.part3.4_prison_inmate_labor_credit_col_b": column((credit) => credit.used),
  "1.part3.4_prison_inmate_labor_credit_col_c": column((credit) => credit.balance),
};
