/*
 * Schedule J from the return and the answers. Every read is by full field id,
 * so Form 1040 line 16 and Form 6251 line 10 can call these with their own
 * accessors, as they do Form 8615's.
 */

import { atLeast, numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import { netLongTermGain } from "../1040/qdcgInputs.js";
import { taxOnIncome, taxWithoutScheduleJ } from "../1040/taxOnIncome.js";
import type { BaseYear } from "./baseYears.js";
import { baseYearTax, type GainShare } from "./baseYearTax.js";
import type { ScheduleJAnswers } from "./filingInfo.js";
import {
  baseYearShare,
  combinedWithShare,
  isGap,
  line17,
  line22,
  line23,
  line2a,
  line2b,
  line2c,
  line3,
  line6,
  line7,
  type Line,
} from "./lines.js";

/* Any form's accessor: these functions read fields by their full id only. */
type Accessor = { readonly [fieldId: string]: unknown };

/* One base year's block: lines 5–8, 9–12 or 13–16. */
export interface BaseYearLines {
  /* Line 5, 9 or 13. */
  income: number;
  /* Line 6, 10 or 14: line 6. */
  share: number;
  /* Line 7, 11 or 15. */
  combined: number;
  /* Line 8, 12 or 16. */
  tax: Line;
  /* Line 19, 20 or 21. */
  earlierTax: number;
}

export interface ScheduleJLines {
  line1: number;
  line2a: number;
  line2b?: number;
  line2c?: number;
  line3: number;
  line4: Line;
  line6: number;
  /* 2022, 2023, 2024. */
  years: BaseYearLines[];
  line17: Line;
  line22: number;
  line23: Line;
}

const CHILD_FORM_8615 =
  "Form 8615 files on this return: the child's tax uses Schedule J as a worksheet for Form 8615 lines 9 and 15 (irs-8615-inst-2025::sec::worksheet-2-for-line-11-of-the-schedule-d::b02, ::using-the-qualified-dividends-and-capital-gain-tax-worksheet-2::b05), which the engine does not model.";

export const filesScheduleJ = (info: Form1040FilingInfo) =>
  info.mustFile?.["schedule-j"]?.value === true;

/*
 * Line 4: the 2025 tax on line 3, with the capital gain of lines 2b and 2c
 * left out of the return's net capital gain and unrecaptured section 1250
 * gain: that part is taxed in the base years (QUESTIONS.md question 2).
 *
 * DECISION (2026-11-26, by the author): line 4 says only "Figure the tax on
 * the amount on line 3 using: The 2025 Tax Table, Tax Computation Worksheet,
 * or Qualified Dividends and Capital Gain Tax Worksheet ... or The Schedule D
 * Tax Worksheet" (irs-1040sj-inst-2025::sec::line-4::b01), and those
 * worksheets take the return's whole net capital gain. Lines 8, 12 and 16
 * "allocate 1/3 of the amount on Schedule J, line 2b ... to 2022" (line-8::b01),
 * and Publication 225: "If your EFI includes both ordinary income and capital
 * gains, you must use tax rates from each base year to compute tax on an equal
 * portion of each type of income" (irs-pub-225-2025::sec::elected-farm-income-efi::b02).
 * The engine takes line 2b off the worksheet's net capital gain (and line 2c
 * off Schedule D line 19): otherwise the gain on line 2b gets the capital gain
 * rates twice, in 2025 and in the base years. Publication 225 is the farmer's
 * guide, and it governs a farm's forms.
 */
function line4(
  form: Accessor,
  info: Form1040FilingInfo,
  amount: number,
  left: GainShare,
): Line | undefined {
  if (info.mustFile?.["form-8615"]?.value === true) return unsupported(CHILD_FORM_8615);
  return taxOnIncome(form, info, amount, left);
}

/* The lines of one base year. 2022's line 7 enters 0 at zero or less; 2023's and 2024's keep a negative. */
function baseYearLines(base: BaseYear, share: number, gain: GainShare): BaseYearLines {
  const combined =
    base.year === 2022 ? line7(base.income, share) : combinedWithShare(base.income, share);
  return {
    income: base.income,
    share,
    combined,
    tax: baseYearTax(base, combined, gain),
    earlierTax: base.tax,
  };
}

/* Every line, or undefined while line 1 or line 4 waits. */
export function scheduleJLines(
  form: Accessor,
  info: Form1040FilingInfo,
  answers: ScheduleJAnswers,
): ScheduleJLines | undefined {
  const line1 = numberOrBlank(form["form-1040.line.15"]);
  if (line1 === undefined) return undefined;
  const { election } = answers;
  const elected = line2a(election.electedFarmIncome, line1);
  const gain = line2b(election.netCapitalGain, elected, netLongTermGain(form));
  const section1250 = line2c(gain, election.unrecapturedSection1250Gain);
  const remaining = line3(line1, elected);
  const left = { netCapitalGain: gain ?? 0, unrecapturedSection1250Gain: section1250 ?? 0 };
  const tax2025 = line4(form, info, atLeast(0, remaining), left);
  if (tax2025 === undefined) return undefined;
  const third = line6(elected);
  const share = {
    netCapitalGain: baseYearShare(gain),
    unrecapturedSection1250Gain: baseYearShare(section1250),
  };
  const years = answers.baseYears.map((base) => baseYearLines(base, third, share));
  const total = line17(tax2025, ...(years.map((year) => year.tax) as [Line, Line, Line]));
  const earlier = line22(years[0].earlierTax, years[1].earlierTax, years[2].earlierTax);
  return {
    ...{ line1, line2a: elected, line2b: gain, line2c: section1250, line3: remaining },
    ...{ line4: tax2025, line6: third, years, line17: total, line22: earlier },
    line23: line23(total, earlier),
  };
}

/* The lines when Schedule J files and its answers are known; undefined otherwise. */
export function scheduleJOf(form: Accessor, info: Form1040FilingInfo): ScheduleJLines | undefined {
  if (!filesScheduleJ(info) || info.scheduleJ === undefined) return undefined;
  return scheduleJLines(form, info, info.scheduleJ);
}

/*
 * Form 1040 line 16's tax on taxable income with Schedule J: "Also include
 * this amount on Form 1040, 1040-SR, or 1040-NR, line 16" (the face, line 23).
 * Undefined while it waits.
 */
export function scheduleJTax(
  form: Accessor,
  info: Form1040FilingInfo,
): number | Unsupported | undefined {
  return scheduleJOf(form, info)?.line23;
}

/*
 * Form 6251 line 10: "If you used Schedule J to figure your tax on Form 1040
 * ... line 16, refigure that tax without using Schedule J before completing
 * this line" (irs-6251-inst-2025::sec::line-10::b02). What to add to line 16
 * for that: the tax without Schedule J less line 23. 0 when Schedule J does
 * not file; undefined while either waits.
 */
export function scheduleJRefigure(form: Accessor, info: Form1040FilingInfo): Line | undefined {
  if (!filesScheduleJ(info)) return 0;
  const withJ = scheduleJTax(form, info);
  const taxable = numberOrBlank(form["form-1040.line.15"]);
  if (withJ === undefined || taxable === undefined) return undefined;
  if (isGap(withJ)) return withJ;
  const without = taxWithoutScheduleJ(form, info, taxable);
  if (without === undefined || typeof without === "object") return without;
  return without - withJ;
}
