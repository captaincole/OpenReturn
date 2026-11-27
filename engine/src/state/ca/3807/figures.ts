/*
 * FTB 3807's figures from the filing info and the return, by full field id:
 * Worksheet II, Schedule Z Part I, the credit Schedule P (540) is offered and
 * Schedule Z Part II. The form's bindings, Schedule P (540), Form 540 lines 43
 * to 45, Schedule S line 2 and Schedule CA (540) line 9b3 all figure them
 * here, so no reader waits on a line that has a gap. Each is the figures, the
 * reason the engine cannot figure them, or undefined while an input waits.
 */

import { FIRST_LAMBRA_NOL_YEAR, LAST_LAMBRA_NOL_YEAR } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank, roundDollars } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { californiaTaxOn } from "../3800-ca/tax.js";
import { suspendedOf, type Info as Form3805VInfo } from "../3805v/figures.js";
import type { Form3807FilingInfo } from "./filingInfo.js";
import {
  BUSINESS_CREDIT_LIMIT,
  creditOffered,
  modifiedTaxableIncome,
  scheduleZPartI,
  scheduleZPartII,
  worksheetII,
  type ScheduleZPartI,
  type ScheduleZPartII,
  type WorksheetII,
} from "./lines.js";

export type ReadField = (fieldId: string) => unknown;
export type Info = Form3807FilingInfo & Form3805VInfo;

const FORM_540_LINE_35 = "form-540.line.35_total_tax_after_credits";

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;
export const files3807 = (info: BaseFilingInfo) => files(info, "form-3807");

const NONRESIDENT_RETURN = unsupported(
  "FTB 3807 on a Form 540NR return reads Schedule CA (540NR) and Form 540NR line 42, which the engine does not figure for this form.",
);
const NOT_FORM_540 = unsupported(
  "FTB 3807 is figured only for an individual on Form 540; a fiduciary or entity return (Form 541, 100, 100S, 109) is not in the engine.",
);
const NOL_YEAR_OUTSIDE = unsupported(
  `A LAMBRA NOL carryover is stated for a year outside Worksheet II's lines 8a to 8m (${FIRST_LAMBRA_NOL_YEAR} to ${LAST_LAMBRA_NOL_YEAR}); no LAMBRA NOL arises after 2013 (ca-3807-booklet-2025::sec::part-iii-net-operating-loss-nol-carryover-and-deduction::b01).`,
);
const OVER_BUSINESS_CREDIT_LIMIT = unsupported(
  "Form 540 line 35 is over $5,000,000, so the business credit limitation and the FTB 3870 election (ca-3807-booklet-2025::sec::general-information::b02) can apply to the LAMBRA credits; the engine does not figure them.",
);

/* A case of the whole return the engine does not handle, else undefined. */
export function lambraReturnGap(info: BaseFilingInfo): Unsupported | undefined {
  if (files(info, "form-540nr")) return NONRESIDENT_RETURN;
  if (!files(info, "form-540")) return NOT_FORM_540;
  return undefined;
}

const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* The return as a record of full field ids, for FTB 3805V's suspension test. */
const recordOf = (read: ReadField): Record<string, unknown> =>
  new Proxy({}, { get: (_, key) => (typeof key === "string" ? read(key) : undefined) });

/*
 * Worksheet II, with the NOL suspension test of FTB 3805V (the same rule:
 * suspended for 2025 when net business income and modified AGI are each
 * $1,000,000 or more, ca-3807-booklet-2025::sec::part-iii-net-operating-loss-nol-carryover-and-deduction::b01;
 * state/ca/3805v/figures.ts). No carryover stated: every total is 0.
 */
export function worksheetIIOf(read: ReadField, info: Info): WorksheetII | Unsupported | undefined {
  const gap = lambraReturnGap(info);
  if (gap !== undefined) return gap;
  const rows = info.lambraNolCarryovers;
  if (rows === undefined) return undefined;
  const carried = rows.filter((row) => row.carryover > 0);
  if (carried.length === 0) return worksheetII(0, rows, false);
  const outside = (year: number) => year < FIRST_LAMBRA_NOL_YEAR || year > LAST_LAMBRA_NOL_YEAR;
  if (carried.some((row) => outside(row.yearOfLoss))) return NOL_YEAR_OUTSIDE;
  const income = info.lambraBusinessIncome;
  if (income === undefined) return undefined;
  const suspended = suspendedOf(recordOf(read), info);
  if (suspended === undefined || isGap(suspended)) return suspended;
  return worksheetII(modifiedTaxableIncome(income), rows, suspended);
}

/* The LAMBRA NOL deduction (line 3b): 0 with no FTB 3807. */
export function lambraNolDeduction(read: ReadField, info: Info): number | Unsupported | undefined {
  if (!files3807(info)) return 0;
  const figures = worksheetIIOf(read, info);
  if (figures === undefined || isGap(figures)) return figures;
  return figures.totalDeducted;
}

/* Schedule Z, Part I; undefined while the income, the NOL, the filing status or line 35 waits. */
export function partIOf(read: ReadField, info: Info): ScheduleZPartI | Unsupported | undefined {
  const nol = worksheetIIOf(read, info);
  if (nol === undefined || isGap(nol)) return nol;
  const income = info.lambraBusinessIncome;
  const status = info.filingStatus;
  const line35 = numberOrBlank(read(FORM_540_LINE_35));
  if (income === undefined || status === undefined || line35 === undefined) return undefined;
  return scheduleZPartI(income, nol.totalDeducted, line35, (amount) =>
    californiaTaxOn(amount, status),
  );
}

/* Both credit carryovers in whole dollars; undefined while one waits. */
export function carryoversOf(info: Info): { hiring: number; salesUse: number } | undefined {
  const hiring = info.lambraHiringCarryover;
  const salesUse = info.lambraSalesUseCarryover;
  if (hiring === undefined || salesUse === undefined) return undefined;
  return { hiring: roundDollars(hiring), salesUse: roundDollars(salesUse) };
}

/* The return has a LAMBRA credit carryover above 0 (Schedule Z is completed). */
export const hasLambraCredit = (info: Info): boolean =>
  (info.lambraHiringCarryover ?? 0) + (info.lambraSalesUseCarryover ?? 0) > 0;

/*
 * Schedule P (540) Section A2 column (a) for code 198 (lines.ts,
 * creditOffered): 0 with no FTB 3807 or no credit carryover. Above $5,000,000
 * of tax the business credit limit can bind, and the engine does not figure it.
 */
export function lambraCreditOffered(read: ReadField, info: Info): number | Unsupported | undefined {
  if (!files3807(info)) return 0;
  const gap = lambraReturnGap(info);
  if (gap !== undefined) return gap;
  const carryovers = carryoversOf(info);
  if (carryovers === undefined) return undefined;
  if (carryovers.hiring + carryovers.salesUse <= 0) return 0;
  const partI = partIOf(read, info);
  if (partI === undefined || isGap(partI)) return partI;
  if (partI.line6b > BUSINESS_CREDIT_LIMIT) return OVER_BUSINESS_CREDIT_LIMIT;
  return creditOffered(partI.line7, carryovers.hiring, carryovers.salesUse);
}

/* Schedule Z, Part II from the credit Schedule P (540) column (b) lets the return use. */
export function partIIOf(
  read: ReadField,
  info: Info,
  used: number,
): ScheduleZPartII | Unsupported | undefined {
  const partI = partIOf(read, info);
  const carryovers = carryoversOf(info);
  if (partI === undefined || isGap(partI)) return partI;
  if (carryovers === undefined) return undefined;
  return scheduleZPartII(partI.line7, carryovers.hiring, carryovers.salesUse, used);
}
