/* 1040 instructions (2025) p. 38, QDCG Tax Worksheet—Line 16. Breakdown lines match the worksheet 1:1. */

import { lookupPreferentialBrackets } from "../data/preferentialBrackets.js";
import { lookupRateSchedule } from "../data/rateSchedule.js";
import { lookupTax } from "../data/taxTable.js";
import { atLeast, roundDollars } from "../money.js";
import type { FilingStatus } from "../values.js";

export interface QdcgInputs {
  /** Line 1: 1040 line 15. */
  taxableIncome: number;
  /** Line 2: 1040 line 3a. */
  qualifiedDividends: number;
  /** Line 3: the caller picks the smaller of Schedule D lines 15/16 (loss = 0), or 1040 line 7a without Schedule D. */
  netLongTermGain: number;
  /** Form 2555 re-routes lines 1 and 2 through the FEIE worksheet. Not modeled. */
  filingForm2555?: boolean;
  filingStatus: FilingStatus;
  taxYear: number;
}

export interface QdcgBreakdown {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
  line14: number;
  line15: number;
  line16: number;
  line17: number;
  line18: number;
  line19: number;
  line20: number;
  line21: number;
  line22: number;
  line23: number;
  line24: number;
  line25: number;
}

export interface QdcgResult {
  tax: number;
  /** Line 24: tax without the preferential rates. */
  ordinaryAlternativeTax: number;
  breakdown: QdcgBreakdown;
}

function taxByAmount(amount: number, filingStatus: FilingStatus, taxYear: number): number {
  if (amount < 0) return 0;
  if (amount < 100000) {
    const r = lookupTax(`federal-${taxYear}`, amount, filingStatus);
    if (!r.ok) {
      throw new Error(
        `QDCG worksheet: tax-table lookup for ${amount} (${filingStatus}, ${taxYear}) failed: ${r.message}`,
      );
    }
    return r.tax;
  }
  return roundDollars(lookupRateSchedule(taxYear, filingStatus, amount));
}

/** Throws on negative inputs or a failed tax lookup: both are binding-layer bugs. */
// eslint-disable-next-line max-lines-per-function -- line-by-line transcription of the IRS QDCG worksheet; splitting it would break the 1:1 audit against the published form
export function computeQdcg(inputs: QdcgInputs): QdcgResult {
  if (inputs.taxableIncome < 0) {
    throw new Error(`QDCG worksheet: taxableIncome must be ≥ 0 (got ${inputs.taxableIncome}).`);
  }
  if (inputs.qualifiedDividends < 0 || inputs.netLongTermGain < 0) {
    throw new Error(
      `QDCG worksheet: preferential inputs must be ≥ 0 (got qd=${inputs.qualifiedDividends}, ltcg=${inputs.netLongTermGain}).`,
    );
  }
  // TODO: with Form 2555, swap lines 1 and 2 for the FEIE worksheet outputs.
  void inputs.filingForm2555;

  const { filingStatus, taxYear } = inputs;
  const brackets = lookupPreferentialBrackets(taxYear, filingStatus);

  // Lines 1–3 are already whole dollars; roundDollars only guards against cents.
  const line1 = roundDollars(inputs.taxableIncome);
  const line2 = roundDollars(inputs.qualifiedDividends);
  const line3 = roundDollars(inputs.netLongTermGain);
  const line4 = line2 + line3;
  const line5 = atLeast(0, line1 - line4);

  const line6 = brackets.zeroRateCeiling;
  const line7 = Math.min(line1, line6);
  const line8 = Math.min(line5, line7);
  const line9 = line7 - line8;

  const line10 = Math.min(line1, line4);
  const line11 = line9;
  const line12 = line10 - line11;
  const line13 = brackets.fifteenRateCeiling;
  const line14 = Math.min(line1, line13);
  const line15 = line5 + line9;
  const line16 = atLeast(0, line14 - line15);
  const line17 = Math.min(line12, line16);
  const line18 = roundDollars(line17 * 0.15);

  const line19 = line9 + line17;
  const line20 = atLeast(0, line10 - line19);
  const line21 = roundDollars(line20 * 0.2);

  const line22 = taxByAmount(line5, filingStatus, taxYear);
  const line23 = line18 + line21 + line22;
  const line24 = taxByAmount(line1, filingStatus, taxYear);
  const line25 = Math.min(line23, line24);

  return {
    tax: line25,
    ordinaryAlternativeTax: line24,
    breakdown: {
      line1,
      line2,
      line3,
      line4,
      line5,
      line6,
      line7,
      line8,
      line9,
      line10,
      line11,
      line12,
      line13,
      line14,
      line15,
      line16,
      line17,
      line18,
      line19,
      line20,
      line21,
      line22,
      line23,
      line24,
      line25,
    },
  };
}
