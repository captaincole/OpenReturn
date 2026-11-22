/*
 * The tax on a Form 8615 amount (lines 9, 15 and 17): the Qualified Dividends
 * and Capital Gain Tax Worksheet when the amount holds qualified dividends or
 * net capital gain, else the Tax Table or Tax Computation Worksheet
 * (irs-8615-inst-2025::sec::line-9::b01, ::line-15::b01, ::line-17::b01). The
 * worksheet with no preferential income gives the table's answer, so one path
 * figures both; the box shows which method the line used.
 */

import type { FilingStatus } from "../../values.js";
import { computeQdcg } from "../../worksheets/qdcg.js";
import type { PreferentialParts } from "./lines.js";

export interface TaxOnAmount {
  tax: number;
  /* The line's box: "If the Qualified Dividends and Capital Gain Tax Worksheet ... is used". */
  worksheetUsed: boolean;
}

/*
 * The worksheet as the Form 8615 instructions fill it: line 1 the amount,
 * line 2 the qualified dividends in it, line 3 the net capital gain in it, and
 * the filing status the line names (::using-the-qualified-dividends-and-capital-gain-tax-worksheet::b01,
 * ::using-the-qualified-dividends-and-capital-gain-tax-worksheet-2::b01).
 */
export function taxOnAmount(
  amount: number,
  parts: PreferentialParts,
  filingStatus: FilingStatus,
): TaxOnAmount {
  const result = computeQdcg({
    taxableIncome: amount,
    qualifiedDividends: parts.qualifiedDividends,
    netLongTermGain: parts.netCapitalGain,
    filingStatus,
    taxYear: 2025,
  });
  return {
    tax: result.tax,
    worksheetUsed: parts.qualifiedDividends + parts.netCapitalGain > 0,
  };
}
