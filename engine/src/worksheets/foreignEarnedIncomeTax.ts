/*
 * The Foreign Earned Income Tax Worksheet—Line 16 (1040 instructions 2025,
 * irs-1040-inst-2025::sec::foreign-earned-income-tax-worksheet-line-16::b01–b04).
 * A filer of Form 2555 figures the tax on the income not excluded "using the
 * tax rates that would have applied had you not claimed the exclusions"
 * (irs-2555-inst-2025::sec::figuring-tax-on-income-not-excluded::b01).
 */

import { atLeast } from "../money.js";
import { computeQdcg, taxByAmount, type QdcgInputs } from "./qdcg.js";

export interface ForeignEarnedIncomeTaxLines {
  line1: number;
  line2a: number;
  line2b: number;
  line2c: number;
  line3: number;
  /* The capital gain excess of the QDCG worksheet (b03); 0 when there is none. */
  capitalGainExcess: number;
  line4: number;
  line5: number;
  line6: number;
}

/*
 * The modifications for a capital gain excess, "only for purposes of filling
 * out the Foreign Earned Income Tax Worksheet" (b03–b04): reduce QDCG line 3
 * (but not below zero) by the excess, then line 2 by what is left of it.
 */
function lessCapitalGainExcess(inputs: QdcgInputs, excess: number): QdcgInputs {
  const netLongTermGain = atLeast(0, inputs.netLongTermGain - excess);
  const left = excess - (inputs.netLongTermGain - netLongTermGain);
  return {
    ...inputs,
    netLongTermGain,
    qualifiedDividends: atLeast(0, inputs.qualifiedDividends - left),
  };
}

/*
 * Line 4 by the QDCG worksheet: "Enter the amount from line 3 above on line 1
 * of the Qualified Dividends and Capital Gain Tax Worksheet ... Complete the
 * rest of that worksheet through line 4", then subtract line 15 from its line 4
 * for the capital gain excess; with an excess, a second worksheet "in its
 * entirety" with the modifications (b02, b03). With no qualified dividends or
 * gains the worksheet is the Tax Table or the Tax Computation Worksheet.
 */
export function foreignEarnedIncomeTax(
  qdcg: QdcgInputs,
  excluded: { line2a: number; line2b: number },
): ForeignEarnedIncomeTaxLines {
  const line1 = qdcg.taxableIncome;
  const line2c = atLeast(0, excluded.line2a - excluded.line2b);
  const line3 = line1 + line2c;
  const withLine3 = { ...qdcg, taxableIncome: line3 };
  const first = computeQdcg(withLine3);
  const capitalGainExcess = atLeast(0, first.breakdown.line4 - line1);
  const line4 =
    capitalGainExcess > 0
      ? computeQdcg(lessCapitalGainExcess(withLine3, capitalGainExcess)).tax
      : first.tax;
  // Line 5: "If the amount on line 2c is less than $100,000, use the Tax Table ... $100,000 or more, use the Tax Computation Worksheet".
  const line5 = taxByAmount(line2c, qdcg.filingStatus, qdcg.taxYear);
  return {
    line1,
    line2a: excluded.line2a,
    line2b: excluded.line2b,
    line2c,
    line3,
    capitalGainExcess,
    line4,
    line5,
    // Line 6: "Subtract line 5 from line 4. Enter the result. If zero or less, enter -0-."
    line6: atLeast(0, line4 - line5),
  };
}

/* Line 3 for the Schedule D Tax Worksheet path: the 1040 side checks its capital gain excess (its line 10). */
export const foreignWorksheetLine3 = (taxableIncome: number, line2a: number, line2b: number) =>
  taxableIncome + atLeast(0, line2a - line2b);
