/* Form 2210 Part I, Required Annual Payment (lines 1–9), as pure arithmetic. */

import { roundDollars } from "../../money.js";

/* Lines 4 and 7: "If less than $1,000, stop; you don't owe a penalty." */
export const PENALTY_FLOOR = 1000;
/* Line 5: 90% of the 2025 tax. */
export const CURRENT_YEAR_PERCENT = 0.9;
/*
 * Line 8: 110% of the 2024 tax when the 2024 AGI is more than $150,000
 * ($75,000 if married filing separately for 2025) (irs-2210-inst-2025::sec::line-19::b02).
 */
export const HIGH_INCOME_PRIOR_YEAR_PERCENT = 1.1;
export const HIGH_INCOME_AGI = 150_000;
export const HIGH_INCOME_AGI_MFS = 75_000;

export interface PartIInputs {
  /* Line 1: Form 1040 line 22 (irs-2210-inst-2025::sec::line-1::b01). */
  taxAfterCredits: number;
  /* Line 2: the Schedule 2 lines that line-2::b01 lists. */
  otherTaxes: number;
  /* Line 3: refundable credits, a positive amount the form prints in parentheses (line-3::b01). */
  refundableCredits: number;
  /* Line 6: Form 1040 line 25d plus Schedule 3 line 11 (line-6::b01). */
  withholding: number;
  /* The 2024 tax as line 8 figures it; undefined when there was no 12-month 2024 return. */
  priorYearTax?: number;
  priorYearAgi?: number;
  marriedFilingSeparately: boolean;
}

export interface PartILines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  /* Lines 5–9 are blank when line 4 is under $1,000 (the form stops there). */
  line5?: number;
  line6?: number;
  line7?: number;
  /* Lines 8–9 are blank when line 7 is under $1,000. Line 8 is also blank with no 12-month 2024 return. */
  line8?: number;
  line9?: number;
  /* "Is line 9 more than line 6?" undefined when the form stopped first. */
  line9MoreThanLine6?: boolean;
}

/* Line 8 (line-8::b01, line-19::b02): the 2024 tax, or 110% of it for a high 2024 AGI. */
export function priorYearRequiredPayment(
  priorYearTax: number,
  priorYearAgi: number,
  marriedFilingSeparately: boolean,
): number {
  const threshold = marriedFilingSeparately ? HIGH_INCOME_AGI_MFS : HIGH_INCOME_AGI;
  return priorYearAgi > threshold
    ? roundDollars(priorYearTax * HIGH_INCOME_PRIOR_YEAR_PERCENT)
    : roundDollars(priorYearTax);
}

/*
 * Lines 1–9 (the blank form). Line 9 is the smaller of lines 5 and 8; with no
 * 12-month 2024 return, "don't complete line 8. Instead, enter the amount from
 * line 5 on line 9" (irs-2210-inst-2025::sec::line-19::b03).
 */
export function partILines(inputs: PartIInputs): PartILines {
  const line1 = roundDollars(inputs.taxAfterCredits);
  const line2 = roundDollars(inputs.otherTaxes);
  const line3 = roundDollars(inputs.refundableCredits);
  const line4 = line1 + line2 - line3;
  const stopped = { line1, line2, line3, line4 };
  if (line4 < PENALTY_FLOOR) return stopped;
  const line5 = roundDollars(line4 * CURRENT_YEAR_PERCENT);
  const line6 = roundDollars(inputs.withholding);
  const line7 = line4 - line6;
  if (line7 < PENALTY_FLOOR) return { ...stopped, line5, line6, line7 };
  const line8 =
    inputs.priorYearTax === undefined
      ? undefined
      : priorYearRequiredPayment(
          inputs.priorYearTax,
          inputs.priorYearAgi ?? 0,
          inputs.marriedFilingSeparately,
        );
  const line9 = line8 === undefined ? line5 : Math.min(line5, line8);
  return { ...stopped, line5, line6, line7, line8, line9, line9MoreThanLine6: line9 > line6 };
}
