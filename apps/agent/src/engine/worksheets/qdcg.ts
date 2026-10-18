/*
 * Qualified Dividends and Capital Gain Tax Worksheet — Line 16.
 *
 * Implements all 25 lines of the IRS worksheet from the 2025 Form 1040
 * Instructions (page 38). The result carries the full breakdown next to
 * the final tax, so callers can audit, render an explanation, or test
 * any intermediate line.
 *
 * Source: IRS Form 1040 (2025) Instructions, page 38, "Qualified
 * Dividends and Capital Gain Tax Worksheet—Line 16".
 * Corpus block id: irs-1040-inst-2025::sec::qualified-dividends-and-capital-gain-tax-worksheet-line-16::b02.
 *
 * Inline notes mark worksheet inputs that come from unsupported fields.
 * They default to 0 / not-filing for now. When ingestion lands, the
 * binding layer passes through the real values.
 */

import { lookupPreferentialBrackets } from "../data/preferentialBrackets.js";
import { lookupRateSchedule } from "../data/rateSchedule.js";
import { lookupTax } from "../data/taxTable.js";
import { atLeast, roundDollars } from "../money.js";
import type { FilingStatus } from "../values.js";

export interface QdcgInputs {
  /** Worksheet line 1 — 1040 line 15 (taxable income). */
  taxableIncome: number;
  /**
   * Worksheet line 2 — 1040 line 3a (qualified dividends). Defaults to 0
   * when the taxpayer has no qualified dividends. The 1040 line.3a
   * binding reads `info.qualifiedDividends`, summed from 1099-DIV box 1b
   * facts; when no 1099-DIV facts exist this is already 0.
   */
  qualifiedDividends: number;
  /**
   * Worksheet line 3 — the smaller of Schedule D line 15 or line 16,
   * with blank/loss values treated as 0. The caller makes the smaller-of
   * selection; the worksheet uses the resulting number.
   *
   * When Schedule D is not filed, the caller follows the "No" branch of
   * the worksheet's line 3 question and passes `1040 line 7a` directly
   * (0 when there are no capital gains).
   */
  netLongTermGain: number;
  /**
   * Filing Form 2555 (Foreign Earned Income Exclusion) re-routes lines 1
   * and 2 through the Foreign Earned Income Tax Worksheet. We do not
   * model 2555 yet, so this defaults to false. When ingestion lands, a
   * `decisions.scope.must_file_form_2555` decision would set it true,
   * and the worksheet's inputs would come from the FEIE worksheet
   * outputs instead of the raw 1040 values.
   *
   * The flag exists for future support. Today it only confirms the
   * non-2555 path. See the worksheet's two footnotes.
   */
  filingForm2555?: boolean;
  filingStatus: FilingStatus;
  taxYear: number;
}

export interface QdcgBreakdown {
  /*
   * These numbers map 1:1 to the IRS worksheet line numbers. Useful to
   * diff against a CPA-completed worksheet during audit.
   */
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
  /** Final tax — value for 1040 line 16. Equals breakdown.line25. */
  tax: number;
  /**
   * Plain tax on full taxable income (worksheet line 24): what the filer
   * would owe WITHOUT the preferential-rate treatment. The difference
   * `line24 - line25` is the QDCG savings.
   */
  ordinaryAlternativeTax: number;
  /** Full per-line trace. Same numbers a CPA would write on the form. */
  breakdown: QdcgBreakdown;
}

/**
 * Compute tax on an amount via the tax table (< $100k) or the rate
 * schedule (≥ $100k). The worksheet uses this convention at lines 22
 * and 24.
 */
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
  // Rate-schedule tax is un-rounded; round to the nearest dollar (CLAUDE.md).
  return roundDollars(lookupRateSchedule(taxYear, filingStatus, amount));
}

/**
 * Compute the QDCG worksheet for a 1040 filer.
 *
 * Pure function: the same inputs always produce the same output. Throws
 * on negative inputs (the worksheet assumes nonnegative values) and on a
 * failed tax lookup for the (status, year). Both indicate a programming
 * error at the binding layer, not a recoverable runtime condition.
 */
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
  /*
   * TODO: when Form 2555 (Foreign Earned Income) ingestion lands, this
   * branch must swap lines 1 and 2 for the FEIE Tax Worksheet outputs.
   * Until then the code always takes the non-2555 path.
   */
  void inputs.filingForm2555;

  const { filingStatus, taxYear } = inputs;
  const brackets = lookupPreferentialBrackets(taxYear, filingStatus);

  /*
   * Whole dollars (CLAUDE.md). Lines 1–3 copy 1040 lines that are already
   * whole dollars (line 2 = 1040 line 3a, a document sum rounded to the
   * nearest dollar by the caller); roundDollars there only guards against
   * a caller passing cents. Calculated lines round to the nearest dollar
   * too: the percentage lines (L18/L21) and the rate-schedule tax at
   * L22/L24 (taxByAmount).
   * Line 1: 1040 line 15 (taxable income).
   */
  const line1 = roundDollars(inputs.taxableIncome);
  // Line 2: 1040 line 3a (qualified dividends).
  const line2 = roundDollars(inputs.qualifiedDividends);
  /*
   * Line 3: the smaller of Schedule D line 15 / line 16, with blank/loss
   * treated as 0. The caller computes it; the worksheet uses the number.
   */
  const line3 = roundDollars(inputs.netLongTermGain);
  // Line 4: add lines 2 and 3 (total preferential income).
  const line4 = line2 + line3;
  // Line 5: line 1 − line 4 (ordinary bucket; floored at 0).
  const line5 = atLeast(0, line1 - line4);

  // Lines 6–9 — 0% rate computation.
  const line6 = brackets.zeroRateCeiling;
  const line7 = Math.min(line1, line6);
  const line8 = Math.min(line5, line7);
  // Line 9 = preferential dollars at 0%.
  const line9 = line7 - line8;

  // Lines 10–18 — 15% rate computation.
  const line10 = Math.min(line1, line4);
  const line11 = line9;
  const line12 = line10 - line11;
  const line13 = brackets.fifteenRateCeiling;
  const line14 = Math.min(line1, line13);
  const line15 = line5 + line9;
  /*
   * Line 16 of the worksheet, NOT 1040 line 16. Floored at 0 per the
   * instructions.
   */
  const line16 = atLeast(0, line14 - line15);
  // Line 17 = preferential dollars at 15%.
  const line17 = Math.min(line12, line16);
  /*
   * The percentage lines (18 and 21) round to the nearest dollar, the
   * IRS rule (CLAUDE.md, "Whole-dollar rounding").
   */
  const line18 = roundDollars(line17 * 0.15);

  // Lines 19–21 — 20% rate computation.
  const line19 = line9 + line17;
  /*
   * Line 20 = preferential dollars at 20%. Floored at 0 because line 10
   * − line 19 can go negative when line 19 fully absorbs the
   * preferential bucket. That is the typical case for filers below the
   * 20% threshold.
   */
  const line20 = atLeast(0, line10 - line19);
  const line21 = roundDollars(line20 * 0.2);

  // Line 22: tax on line 5 (ordinary bucket) via tax table / rate schedule.
  const line22 = taxByAmount(line5, filingStatus, taxYear);
  // Line 23: total preferential-path tax.
  const line23 = line18 + line21 + line22;
  // Line 24: tax on line 1 (full taxable income), the plain alternative.
  const line24 = taxByAmount(line1, filingStatus, taxYear);
  /*
   * Line 25: the smaller of line 23 or line 24. The min() guarantees the
   * result never exceeds the plain-ordinary calculation. Mathematically
   * that case should not occur, but the worksheet enforces it.
   */
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
