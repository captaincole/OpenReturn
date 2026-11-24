/*
 * Form 2210 Schedule AI, Annualized Income Installment Method, as pure
 * arithmetic. The printed amounts of lines 2, 5, 20, 29, 32 and 34 have no
 * field: they are the constants below (the blank form, page 3).
 */

import { atLeast, roundDollars } from "../../money.js";
import type { FilingStatus } from "../../values.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import { annualizedSelfEmploymentTax, type SelfEmploymentColumn } from "./scheduleAIPartII.js";

/* Lines 2 and 5: annualization amounts for columns (a)–(d). */
export const ANNUALIZATION_AMOUNTS = [4, 2.4, 1.5, 1] as const;
/* Line 20: applicable percentage for columns (a)–(d). */
export const APPLICABLE_PERCENTAGES = [0.225, 0.45, 0.675, 0.9] as const;
/* Line 24: "Enter 25% (0.25) of line 9 on page 1 of Form 2210 in each column". */
export const REGULAR_INSTALLMENT_SHARE = 0.25;

/* One column's inputs: the period's amounts as stated (column (d): the return's). */
export interface AnnualizedColumnInputs {
  adjustedGrossIncome: number;
  /* Line 4; read only when the return itemizes. */
  itemizedDeductions: number;
  /* Line 7: the full standard deduction in every column. */
  standardDeduction: number;
  qbiDeduction: number;
  qualifiedDividends: number;
  netCapitalGain: number;
  otherTaxes: number;
  credits: number;
  /* Line 28 and line 30 (Part II). */
  selfEmployment: SelfEmploymentColumn;
}

export interface ScheduleAIInputs {
  columns: readonly AnnualizedColumnInputs[];
  itemizes: boolean;
  filingStatus: FilingStatus;
  /* Form 2210 Part I line 9. */
  requiredAnnualPayment: number;
}

export interface ScheduleAIColumn {
  line1: number;
  line3: number;
  line4: number;
  /* Lines 5–6 are skipped when the return does not itemize. */
  line6?: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  /* Line 15 and Part II are blank with no net earnings from self-employment in any period. */
  line15?: number;
  line16: number;
  line17: number;
  line18: number;
  line19: number;
  line21: number;
  /* Lines 22 and 25 have no box in column (a). */
  line22?: number;
  line23: number;
  line24: number;
  line25?: number;
  line26: number;
  line27: number;
  partII?: ReturnType<typeof annualizedSelfEmploymentTax>;
}

/*
 * Line 14: the tax on line 13, from the Tax Table or rate schedules through the
 * Qualified Dividends and Capital Gain Tax Worksheet, with the period's
 * qualified dividends and net capital gain annualized by the same amount
 * (irs-2210-inst-2025::sec::line-14::b01; irs-pub-505-2025::sec::2025-annualized-estimated-tax-worksheet-line-10::b01).
 */
function taxOnAnnualizedIncome(
  taxable: number,
  column: AnnualizedColumnInputs,
  factor: number,
  filingStatus: FilingStatus,
): number {
  return computeQdcg({
    taxableIncome: taxable,
    qualifiedDividends: atLeast(0, roundDollars(column.qualifiedDividends * factor)),
    netLongTermGain: atLeast(0, roundDollars(column.netCapitalGain * factor)),
    filingStatus,
    taxYear: 2025,
  }).tax;
}

/* Lines 1–21 of one column (irs-2210-inst-2025::sec::line-1-2::b01 to line-18::b01). */
function annualizedTax(
  column: AnnualizedColumnInputs,
  index: number,
  inputs: ScheduleAIInputs,
  hasSelfEmployment: boolean,
) {
  const factor = ANNUALIZATION_AMOUNTS[index];
  const line1 = roundDollars(column.adjustedGrossIncome);
  const line3 = roundDollars(line1 * factor);
  const line4 = inputs.itemizes ? roundDollars(column.itemizedDeductions) : 0;
  const line6 = inputs.itemizes ? roundDollars(line4 * factor) : undefined;
  const line7 = roundDollars(column.standardDeduction);
  const line8 = Math.max(line6 ?? 0, line7);
  const line9 = roundDollars(column.qbiDeduction);
  const line10 = line8 + line9;
  const line11 = line3 - line10;
  const line12 = 0;
  const line13 = atLeast(0, line11 - line12);
  const line14 = taxOnAnnualizedIncome(line13, column, factor, inputs.filingStatus);
  const partII = hasSelfEmployment
    ? annualizedSelfEmploymentTax(column.selfEmployment, index)
    : undefined;
  const line15 = partII?.line36;
  const line16 = roundDollars(column.otherTaxes);
  const line17 = line14 + (line15 ?? 0) + line16;
  const line18 = roundDollars(column.credits);
  const line19 = atLeast(0, line17 - line18);
  const line21 = roundDollars(line19 * APPLICABLE_PERCENTAGES[index]);
  return {
    ...{ line1, line3, line4, line6, line7, line8, line9, line10, line11, line12, line13 },
    ...{ line14, line15, line16, line17, line18, line19, line21, partII },
  };
}

/*
 * Schedule AI, every column. Lines 22–27 run one column at a time: line 27,
 * the smaller of line 23 or line 26, is the required installment for Part III
 * line 10 (irs-2210-inst-2025::sec::part-i-annualized-income-installments::b01).
 */
export function scheduleAILines(inputs: ScheduleAIInputs): ScheduleAIColumn[] {
  const hasSelfEmployment = inputs.columns.some((column) => column.selfEmployment.netEarnings > 0);
  const line24 = roundDollars(inputs.requiredAnnualPayment * REGULAR_INSTALLMENT_SHARE);
  const out: ScheduleAIColumn[] = [];
  inputs.columns.forEach((column, index) => {
    const tax = annualizedTax(column, index, inputs, hasSelfEmployment);
    const previous = out[index - 1];
    const line22 = previous ? out.reduce((total, each) => total + each.line27, 0) : undefined;
    const line23 = atLeast(0, tax.line21 - (line22 ?? 0));
    const line25 = previous ? previous.line26 - previous.line27 : undefined;
    const line26 = line24 + (line25 ?? 0);
    const line27 = Math.min(line23, line26);
    out.push({ ...tax, line22, line23, line24, line25, line26, line27 });
  });
  return out;
}
