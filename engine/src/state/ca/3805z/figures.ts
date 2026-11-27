/*
 * FTB 3805Z's figures from its inputs and the return: Worksheet I (the
 * business income attributable to the former zone), Worksheet II (the EZ NOL
 * deduction) and Schedule Z Part I (the limitation based on EZ business
 * income). The form's bindings and the credit the return takes
 * (creditUsed.ts) both read them here, so they cannot disagree. Each is a
 * value, the reason the engine cannot figure it, or undefined while an
 * answer or a line waits.
 */

import type { CaEnterpriseZoneIncomeLine } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { atLeast, numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import { suspendedOf } from "../3805v/figures.js";
import { caTaxOnTaxableIncome } from "../540/tax.js";
import type { ScheduleDCaFilingInfo } from "../schedule-d-ca/filingInfo.js";
import type { EnterpriseZoneBusiness, Form3805ZFilingInfo } from "./filingInfo.js";
import {
  line5,
  line7,
  nolWorksheet,
  sectionALine4,
  sectionBLine14,
  type NolWorksheet,
} from "./lines.js";

export type Info = Form3805ZFilingInfo & Pick<ScheduleDCaFilingInfo, "californiaSection1231Gain">;
export type Read = Record<string, unknown>;
type ReadField = (fieldId: string) => unknown;

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

const NONRESIDENT_RETURN = unsupported(
  "FTB 3805Z on a Form 540NR return limits the carryovers by Form 540NR line 42 and Schedule P (540NR), which have no rules yet.",
);
const NOT_FORM_540 = unsupported(
  "FTB 3805Z is figured only for an individual on Form 540; a fiduciary or entity return (Form 541, 100, 100S, 109) is not in the engine.",
);
const NO_FACTORS = unsupported(
  "Worksheet I, Section A has no property and no payroll in California, so the business has no apportionment percentage (ca-3805z-booklet-2025::sec::property-factor-2::b02).",
);

/* A case of the whole return the form does not figure, else undefined. */
export function enterpriseZoneReturnGap(info: BaseFilingInfo): Unsupported | undefined {
  if (files(info, "form-540nr")) return NONRESIDENT_RETURN;
  if (!files(info, "form-540")) return NOT_FORM_540;
  return undefined;
}

/* A field reader as the record that the FTB 3805V reads take. */
export const fieldsOf = (read: ReadField): Read =>
  new Proxy({} as Read, {
    get: (_target, key) => (typeof key === "string" ? read(key) : undefined),
  });

/*
 * Worksheet I, Section A line 4: 1.00 for a business entirely within one
 * former zone, else the average of the factors (lines.ts). Undefined for an
 * investor, who does not complete Section A
 * (ca-3805z-booklet-2025::sec::how-to-claim-deductions-and-credit-carryovers::b01).
 */
export function sectionAPercentage(
  business: EnterpriseZoneBusiness,
): number | Unsupported | undefined {
  const sectionA = business.sectionA;
  if (sectionA === undefined) return undefined;
  if (sectionA === "entirely_within_zone") return 1;
  return sectionALine4(sectionA) ?? NO_FACTORS;
}

const OWN_BUSINESS_LINES: ReadonlySet<CaEnterpriseZoneIncomeLine> = new Set([
  "schedule_c",
  "schedule_e",
  "schedule_f",
  "other_business",
  "schedule_d",
  "schedule_d1",
]);

/*
 * Worksheet I, Section B line 14. The taxpayer's own business rows take
 * Section A line 4 as column (b): "Enter the percentage from Worksheet I,
 * Section A, line 4, column (c) on Worksheet I, Section B, column (b)"
 * (ca-3805z-booklet-2025::sec::part-iii-taxpayer-s-trade-or-business::b02);
 * the other rows take their stated share.
 */
export function line14Of(info: Form3805ZFilingInfo): number | Unsupported | undefined {
  const business = info.enterpriseZone?.business;
  if (business === undefined) return undefined;
  const percentage = sectionAPercentage(business);
  if (isUnsupportedResult(percentage)) return percentage;
  const rows = business.incomeItems.map((item) => ({
    amount: item.amount,
    share:
      OWN_BUSINESS_LINES.has(item.line) && percentage !== undefined
        ? percentage
        : (item.zoneShare ?? 0),
  }));
  return sectionBLine14(rows);
}

/*
 * Worksheet II. The suspension test is FTB 3805V's (state/ca/3805v/figures.ts):
 * "taxpayers with ... net business income or modified adjusted gross income
 * (individuals) of less than $1,000,000 ... are not affected by the NOL
 * suspension rules" (ca-3805z-booklet-2025::sec::part-iii-net-operating-loss-nol-carryover-and-deduction::b01).
 * With no carryover above 0 it is not read.
 */
export function nolFiguresOf(form: Read, info: Info): NolWorksheet | Unsupported | undefined {
  const line14 = line14Of(info);
  const carryovers = info.enterpriseZone?.nolCarryovers;
  if (line14 === undefined || isUnsupportedResult(line14)) return line14;
  if (carryovers === undefined) return undefined;
  if (!carryovers.some((row) => row.amount > 0) || line14 <= 0) {
    return nolWorksheet(line14, carryovers, false);
  }
  const suspended = suspendedOf(form, info);
  if (suspended === undefined || isUnsupportedResult(suspended)) return suspended;
  return nolWorksheet(line14, carryovers, suspended);
}

export interface PartIFigures {
  line1: number;
  line3: number;
  line4: number;
  line5: number;
  line6a: number;
  line6b: number;
  line7: number;
}

/*
 * Schedule Z Part I for an individual: line 1 is Section B line 14, "on this
 * line and on line 3 (skip line 2)" (the form); line 4 is Worksheet II line 9
 * column (c); line 6a is the tax on line 5 "as if the former EZ taxable income
 * represented all of your taxable income", from "the tax table or tax rate
 * schedule in your tax booklet for your filing status"
 * (ca-3805z-booklet-2025::sec::part-i-computation-of-credit-limitations::b02,
 * ::individuals::b01); line 6b is Form 540 line 35.
 */
export function partIOf(form: Read, info: Info): PartIFigures | Unsupported | undefined {
  const gap = enterpriseZoneReturnGap(info);
  if (gap !== undefined) return gap;
  const nol = nolFiguresOf(form, info);
  if (nol === undefined || isUnsupportedResult(nol)) return nol;
  const line1 = line14Of(info) as number;
  const line4 = nol.totalDeducted;
  const taxable = atLeast(0, line5(line1, line4));
  const line6a = info.filingStatus && caTaxOnTaxableIncome(taxable, info.filingStatus);
  const line6b = numberOrBlank(form["form-540.line.35_total_tax_after_credits"]);
  if (typeof line6a !== "number" || line6b === undefined) return undefined;
  return {
    line1,
    line3: line1,
    line4,
    line5: line5(line1, line4),
    line6a,
    line6b,
    line7: line7(line6a, line6b),
  };
}
