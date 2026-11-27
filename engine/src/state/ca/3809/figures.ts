/*
 * FTB 3809's figures from its stated inputs and the return: Worksheet I (the
 * TTA business income), Worksheet II (the NOL deduction) and Schedule Z Part
 * I (the limit based on TTA business income). Each is an amount, the reason
 * the engine cannot figure it, or undefined while an answer or a line waits.
 * `form` reads full field ids. Schedule CA (540) line 9b3 and the credit path
 * (creditUsed.ts) read the form's own lines, not these functions.
 */

import { isGap } from "../../../federal/3800/cells.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { suspendedOf, type Info as Form3805VInfo } from "../3805v/figures.js";
import { caTaxOnTaxableIncome } from "../540/tax.js";
import type { Form3809FilingInfo, TtaInputs } from "./filingInfo.js";
import {
  averageApportionment,
  line14,
  scheduleZPartI,
  ttaShare,
  worksheetII,
  type ScheduleZPartI,
  type WorksheetII,
} from "./lines.js";

export type Info = Form3809FilingInfo & Form3805VInfo;
export type Read = Record<string, unknown>;

/*
 * A read function as the record these figures take. Another form reads this
 * form's figures through the functions, never through the form's fields: a
 * field that is unsupported reads as blank, and its gap would be lost.
 */
export const recordOf = (read: (fieldId: string) => unknown): Read =>
  new Proxy({}, { get: (_target, key) => (typeof key === "string" ? read(key) : undefined) });

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;
export const files3809 = (info: BaseFilingInfo) => files(info, "form-3809");

const NONRESIDENT_RETURN = unsupported(
  "FTB 3809 on a Form 540NR return takes its credits on Form 540NR lines 58 to 60 and its NOL deduction on Schedule CA (540NR) (ca-3809-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b02), which the engine does not fill for this form.",
);
const NOT_FORM_540 = unsupported(
  "FTB 3809 is figured only for a Form 540 return; a fiduciary or entity return (Form 541, 100, 100S, 565, 568) is not in the engine.",
);
const TWO_NOL_FORMS = unsupported(
  "The return also deducts a California NOL on FTB 3805V; which carryover deduction applies first, and how FTB 3805V's modified taxable income takes the TTA deduction, is not settled (QUESTIONS.md).",
);

/* A case of the whole return the form does not handle, else undefined. */
export function returnGap(info: BaseFilingInfo): Unsupported | undefined {
  if (files(info, "form-540nr")) return NONRESIDENT_RETURN;
  if (!files(info, "form-540")) return NOT_FORM_540;
  return undefined;
}

const inputsOf = (info: Form3809FilingInfo): TtaInputs => info.tta ?? {};

/* Worksheet I, Section A, line 4 (Side 1 line 2); undefined while it waits. */
export function sectionAPercentage(info: Form3809FilingInfo): number | undefined {
  const apportionment = inputsOf(info).apportionment;
  return apportionment === undefined ? undefined : averageApportionment(apportionment);
}

/*
 * Worksheet I, Section B, line 14: each row's column (a) times its column
 * (b); a row of the taxpayer's own business takes Section A's percentage
 * ("Enter the percentage from Worksheet I, Section A, line 4, column (c) on
 * Worksheet I, Section B, column (b)",
 * ca-3809-booklet-2025::sec::located-entirely-within-california::b01).
 */
export function businessIncome(info: Form3809FilingInfo): number | undefined {
  const items = inputsOf(info).incomeItems;
  if (items === undefined) return undefined;
  const sectionA = sectionAPercentage(info);
  const shares = items.map((item) => {
    const percentage = item.ttaPercentage ?? sectionA;
    return percentage === undefined ? undefined : ttaShare(item.amount, percentage);
  });
  if (shares.some((share) => share === undefined)) return undefined;
  return line14(shares as number[]);
}

/* The credit carryovers, 0 when none; undefined while one waits. */
export function creditCarryovers(
  info: Form3809FilingInfo,
): { hiring: number; sales: number } | undefined {
  const { hiringCarryover, salesCarryover } = inputsOf(info);
  if (hiringCarryover === undefined || salesCarryover === undefined) return undefined;
  return { hiring: hiringCarryover, sales: salesCarryover };
}

/* The form claims a credit carryover: Schedule Z is completed. Undefined while one waits. */
export function hasCreditCarryover(info: Form3809FilingInfo): boolean | undefined {
  const carryovers = creditCarryovers(info);
  return carryovers === undefined ? undefined : carryovers.hiring + carryovers.sales > 0;
}

/* The form carries a TTA NOL: Worksheet II and Part III are completed. Undefined while it waits. */
export function hasNolCarryover(info: Form3809FilingInfo): boolean | undefined {
  const rows = inputsOf(info).nolRows;
  return rows === undefined ? undefined : rows.length > 0;
}

/*
 * Worksheet II, with the suspension test of FTB 3805V: "For taxable years
 * beginning on or after January 1, 2024, and before January 1, 2027,
 * California has suspended the NOL carryover deduction ... taxpayers with ...
 * net business income or modified adjusted gross income (individuals) of less
 * than $1,000,000 ... are not affected"
 * (ca-3809-booklet-2025::sec::part-iii-net-operating-loss-nol-carryover-and-deduction::b01),
 * read as FTB 3805V reads it (3805v/lines.ts, nolSuspended). Undefined with no
 * TTA NOL carryover.
 */
export function nolWorksheet(form: Read, info: Info): WorksheetII | Unsupported | undefined {
  const gap = returnGap(info);
  if (gap !== undefined) return gap;
  const rows = inputsOf(info).nolRows;
  if (rows === undefined || rows.length === 0) return undefined;
  if (files(info, "form-3805v")) return TWO_NOL_FORMS;
  const income = businessIncome(info);
  if (income === undefined) return undefined;
  if (income <= 0) return worksheetII(income, rows, false);
  const suspended = suspendedOf(form, info);
  if (suspended === undefined || isGap(suspended)) return suspended;
  return worksheetII(income, rows, suspended);
}

/* Line 3b and Schedule Z line 4: 0 with no TTA NOL carryover; a gap; undefined while it waits. */
export function nolDeduction(form: Read, info: Info): number | Unsupported | undefined {
  const gap = returnGap(info);
  if (gap !== undefined) return gap;
  const has = hasNolCarryover(info);
  if (has === undefined) return undefined;
  if (!has) return 0;
  const worksheet = nolWorksheet(form, info);
  if (worksheet === undefined || isGap(worksheet)) return worksheet;
  return worksheet.totalDeducted;
}

const LINE_35 = "form-540.line.35_total_tax_after_credits";

/* Schedule Z, Part I, when the form claims a credit carryover; undefined with none or while it waits. */
export function scheduleZ(form: Read, info: Info): ScheduleZPartI | Unsupported | undefined {
  const gap = returnGap(info);
  if (gap !== undefined) return gap;
  if (hasCreditCarryover(info) !== true) return undefined;
  const income = businessIncome(info);
  const deduction = nolDeduction(form, info);
  if (isGap(deduction)) return deduction;
  const line35 = numberOrBlank(form[LINE_35]);
  const status = info.filingStatus;
  if (income === undefined || deduction === undefined || line35 === undefined || !status) {
    return undefined;
  }
  const taxOn = (amount: number) => caTaxOnTaxableIncome(amount, status) ?? 0;
  return scheduleZPartI(income, deduction, line35, taxOn);
}
