/*
 * MANUAL EDIT: the QDCG worksheet inputs that come from the return. Form 1040
 * line 16 and Form 6251 Part III (the regular-tax worksheet's lines 4 and 5)
 * both read them, so both figure the same worksheet.
 */

import { atLeast } from "../../money.js";
import type { FilingStatus } from "../../values.js";
import type { QdcgInputs } from "../../worksheets/qdcg.js";
import { computeScheduleDTax, type ScheduleDTaxResult } from "../../worksheets/scheduleDTax.js";

/** Any form's accessor: full field ids ("schedule-d.0.line.15_…") resolve from every form. */
type ReturnAccessor = { readonly [fieldId: string]: unknown };

/* Worksheet line 3: the smaller of Schedule D lines 15 and 16 (a loss counts as 0). */
export function netLongTermGain(form: ReturnAccessor): number {
  const schDL15 = form["schedule-d.0.line.15_net_long_term_gain_loss"];
  const schDL16 = form["schedule-d.1.line.16_combined_gain_loss"];
  if (schDL15 !== undefined || schDL16 !== undefined) {
    const candL15 = typeof schDL15 === "number" ? atLeast(0, schDL15) : 0;
    const candL16 = typeof schDL16 === "number" ? atLeast(0, schDL16) : 0;
    return Math.min(candL15, candL16);
  }
  // Worksheet line 3 "No" branch: no Schedule D, so use line 7a.
  const l7a = form["form-1040.line.7a"];
  return typeof l7a === "number" ? atLeast(0, l7a) : 0;
}

/*
 * The capital gain that Schedule J line 2b (and line 2c) moves to the base
 * years: its line 4 figures the 2025 tax on line 3 with the return's net
 * capital gain (and unrecaptured section 1250 gain) less these
 * (federal/schedule-j/QUESTIONS.md question 2). Zero for every other tax.
 */
export interface GainLeftOut {
  netCapitalGain: number;
  unrecapturedSection1250Gain: number;
}

export const NO_GAIN_LEFT_OUT: GainLeftOut = { netCapitalGain: 0, unrecapturedSection1250Gain: 0 };

export function qdcgInputsFromReturn(
  form: ReturnAccessor,
  taxableIncome: number,
  qualifiedDividends: number,
  filingStatus: FilingStatus,
  left: GainLeftOut = NO_GAIN_LEFT_OUT,
): QdcgInputs {
  const form4952L4g = form["form-4952.0.line.4g_elected_investment_income"];
  return {
    taxableIncome,
    qualifiedDividends,
    netLongTermGain: atLeast(0, netLongTermGain(form) - left.netCapitalGain),
    // MANUAL EDIT: Form 4952 line 4g leaves the preferential rates (Schedule D Tax Worksheet line 3).
    form4952Line4g: typeof form4952L4g === "number" ? form4952L4g : 0,
    // The Foreign Earned Income Tax Worksheet changes taxableIncome itself (foreignEarnedIncomeTax.ts).
    filingForm2555: false,
    filingStatus,
    taxYear: 2025,
  };
}

const positiveOrZero = (value: unknown): number =>
  typeof value === "number" && value > 0 ? value : 0;

/*
 * MANUAL EDIT: the Schedule D Tax Worksheet takes the place of the QDCG
 * worksheet when Schedule D line 18 or 19 is more than zero and lines 15 and 16
 * are gains (irs-1040sd-inst-2025::sec::schedule-d-tax-worksheet::b01). Line 19
 * has an amount only on a Yes to line 17 (both gains); line 18 is never figured
 * (it is unsupported), so it counts as zero. Undefined: use the QDCG worksheet.
 */
export function scheduleDWorksheetTax(
  form: ReturnAccessor,
  taxableIncome: number,
  qualifiedDividends: number,
  filingStatus: FilingStatus,
  left: GainLeftOut = NO_GAIN_LEFT_OUT,
): number | undefined {
  return scheduleDWorksheet(form, taxableIncome, qualifiedDividends, filingStatus, left)?.tax;
}

/*
 * The whole Schedule D Tax Worksheet, or undefined when the QDCG worksheet
 * applies. Schedule J's capital gain comes off Schedule D lines 15, 16 and 19.
 */
export function scheduleDWorksheet(
  form: ReturnAccessor,
  taxableIncome: number,
  qualifiedDividends: number,
  filingStatus: FilingStatus,
  left: GainLeftOut = NO_GAIN_LEFT_OUT,
): ScheduleDTaxResult | undefined {
  const line19 = atLeast(
    0,
    positiveOrZero(form["schedule-d.1.line.19_unrecaptured_sec1250_gain"]) -
      left.unrecapturedSection1250Gain,
  );
  if (line19 === 0) return undefined;
  const lessGain = (value: unknown) => atLeast(0, positiveOrZero(value) - left.netCapitalGain);
  return computeScheduleDTax({
    taxableIncome,
    qualifiedDividends,
    form4952Line4g: positiveOrZero(form["form-4952.0.line.4g_elected_investment_income"]),
    form4952Line4e: positiveOrZero(form["form-4952.0.line.4e_smaller_net_gain_or_capital_gain"]),
    scheduleDLine15: lessGain(form["schedule-d.0.line.15_net_long_term_gain_loss"]),
    scheduleDLine16: lessGain(form["schedule-d.1.line.16_combined_gain_loss"]),
    scheduleDLine18: positiveOrZero(form["schedule-d.1.line.18_rate_gain_worksheet_amount"]),
    scheduleDLine19: line19,
    filingStatus,
  });
}
