/*
 * The amounts Schedule S takes from the rest of the return (lines 2 and 4), and
 * the credit of every copy. Schedule S, Form 540 line 43 and Schedule P (540)
 * line 20 read them the same way: `read` takes a full field id.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { atLeast, numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { PRIOR_YEAR_AMT_CREDIT_USED, priorYearAmtCreditWaits } from "../3510/creditUsed.js";
import type { OtherStateCreditInput, ScheduleSFilingInfo } from "./filingInfo.js";
import { scheduleSLines, type ScheduleSLines } from "./lines.js";

export type ReadField = (fieldId: string) => unknown;

export const NOT_FORM_540 = unsupported(
  "Schedule S for a nonresident or part-year resident takes Form 540NR lines 32 and 63 (ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01); the engine fills it only for a Form 540 filer.",
);

/*
 * The credits that Form 540 line 47 adds, other than this credit. The credit
 * for prior year AMT is read from its source, Schedule P (540) line 10 column
 * (b): Form 540 line 43 or 44 can hold this credit, so reading them would make
 * line 2 depend on its own credit. Line 45 is not read for the same reason: it
 * holds the total of three or more other credits, and the engine's other
 * credits are this credit, the credit for prior year AMT (read here) and the
 * PTE elective tax credit, which line 2 leaves out.
 */
const OTHER_CREDIT_LINES = [
  "form-540.line.40_child_dependent_care_credit",
  PRIOR_YEAR_AMT_CREDIT_USED,
  "form-540.line.46_renters_credit",
];

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

/*
 * Line 2: "Residents – Form 540, line 48 (without other state tax credit and PTE
 * elective tax credit)" (ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01):
 * line 35 less the other credits of line 47, not less than 0. Line 2 is built
 * from line 35 and never subtracts the PTE elective tax credit (FTB 3804-CR),
 * so nothing needs adding back. With FTB 3506 or FTB 3510
 * filed, the line waits for its credit, as Form 540 line 47 does.
 */
export function californiaTaxLiability(
  read: ReadField,
  info: BaseFilingInfo,
): number | Unsupported | undefined {
  if (!files(info, "form-540")) return NOT_FORM_540;
  const line35 = numberOrBlank(read("form-540.line.35_total_tax_after_credits"));
  if (line35 === undefined) return undefined;
  if (files(info, "form-3506")) {
    const credit = numberOrBlank(read("form-3506.0.line.12_child_dependent_care_credit"));
    if (credit === undefined) return undefined;
    if (credit > 0 && numberOrBlank(read(OTHER_CREDIT_LINES[0])) === undefined) return undefined;
  }
  if (priorYearAmtCreditWaits(read, info)) return undefined;
  return atLeast(0, line35 - sum(...OTHER_CREDIT_LINES.map(read)));
}

/*
 * Line 4: "Residents – Form 540, line 17, and any lump-sum distribution from
 * Schedule G-1" (ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01).
 * The lump sum is what Schedule G-1 taxes apart from AGI: the capital gain of
 * Part II (line 6) and the taxable amount of Part III (line 10) (QUESTIONS.md).
 * Waits while Schedule G-1 files and its tax (line 28) is not figured.
 */
export function californiaAdjustedGrossIncome(
  read: ReadField,
  info: BaseFilingInfo,
): number | Unsupported | undefined {
  if (!files(info, "form-540")) return NOT_FORM_540;
  const line17 = numberOrBlank(read("form-540.line.17_ca_agi"));
  if (line17 === undefined) return undefined;
  if (!files(info, "schedule-g-1")) return line17;
  if (numberOrBlank(read("schedule-g-1.0.line.28_tax_on_lump_sum_distribution")) === undefined) {
    return undefined;
  }
  return sum(
    line17,
    read("schedule-g-1.0.line.6_capital_gain_1099r_box_3"),
    read("schedule-g-1.0.line.10_total_taxable_amount"),
  );
}

const isUnsupported = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* One copy's lines; undefined while a stated answer or a return amount waits. */
export function copyLines(
  read: ReadField,
  info: BaseFilingInfo,
  input: OtherStateCreditInput,
): ScheduleSLines | Unsupported | undefined {
  const californiaTax = californiaTaxLiability(read, info);
  const californiaAgi = californiaAdjustedGrossIncome(read, info);
  if (isUnsupported(californiaTax)) return californiaTax;
  if (isUnsupported(californiaAgi)) return californiaAgi;
  const { items, taxPaid, otherStateAdjustedGrossIncome } = input;
  if (californiaTax === undefined || californiaAgi === undefined) return undefined;
  if (items === undefined || taxPaid === undefined || otherStateAdjustedGrossIncome === undefined) {
    return undefined;
  }
  return scheduleSLines({
    californiaTax,
    californiaAgi,
    items,
    taxPaid,
    otherStateAdjustedGrossIncome,
  });
}

/*
 * "Add the credits from each state's Schedule S, line 12 and enter the total on
 * your tax return" (ca-540-sched-s-inst-2025::sec::specific-line-instructions::b01).
 * Undefined while any copy waits.
 */
export function otherStateCreditTotal(
  read: ReadField,
  info: ScheduleSFilingInfo,
): number | Unsupported | undefined {
  let total = 0;
  for (const input of info.otherStateCredits ?? []) {
    const lines = copyLines(read, info, input);
    if (lines === undefined || isUnsupported(lines)) return lines;
    total += lines.line12;
  }
  return total;
}

/* Schedule S is on the return. */
export const filesScheduleS = (info: BaseFilingInfo) => files(info, "schedule-s");
