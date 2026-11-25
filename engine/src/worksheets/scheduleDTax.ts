/*
 * The Schedule D Tax Worksheet (irs-1040sd-inst-2025::sec::schedule-d-tax-worksheet::b01–b04,
 * ::schedule-d-tax-worksheet-continued-keep-for-your-records::b01–b03). Form 1040
 * line 16 uses it when Schedule D line 18 or 19 is more than zero and lines 15
 * and 16 are gains. Lines follow the worksheet one to one; a percentage line
 * rounds to the nearest dollar, as the QDCG worksheet does.
 */

import { lookupPreferentialBrackets } from "../data/preferentialBrackets.js";
import { atLeast, roundDollars } from "../money.js";
import type { FilingStatus } from "../values.js";
import { taxByAmount } from "./qdcg.js";

/* Line 19: the top of the 24% bracket (::b03). */
const LINE_19_AMOUNT_2025: Record<FilingStatus, number> = {
  single: 197300,
  married_filing_separately: 197300,
  married_filing_jointly: 394600,
  qualifying_surviving_spouse: 394600,
  head_of_household: 197300,
};

const RATE_15 = 0.15;
const RATE_20 = 0.2;
const RATE_25 = 0.25;
const RATE_28 = 0.28;

export interface ScheduleDTaxInputs {
  /* Line 1: Form 1040 line 15. */
  taxableIncome: number;
  /* Line 2: Form 1040 line 3a. */
  qualifiedDividends: number;
  /* Line 3: Form 4952 line 4g. */
  form4952Line4g: number;
  /* Line 4: Form 4952 line 4e. */
  form4952Line4e: number;
  scheduleDLine15: number;
  scheduleDLine16: number;
  scheduleDLine18: number;
  scheduleDLine19: number;
  filingStatus: FilingStatus;
}

export type ScheduleDTaxBreakdown = Record<`line${number}`, number>;

export interface ScheduleDTaxResult {
  tax: number;
  breakdown: ScheduleDTaxBreakdown;
}

/* Lines 1–22: the amounts taxed at 0% and the ordinary part. */
function lines1To22(inputs: ScheduleDTaxInputs) {
  const brackets = lookupPreferentialBrackets(2025, inputs.filingStatus);
  const line1 = inputs.taxableIncome;
  const line2 = inputs.qualifiedDividends;
  const line3 = inputs.form4952Line4g;
  const line4 = inputs.form4952Line4e;
  const line5 = atLeast(0, line3 - line4);
  const line6 = atLeast(0, line2 - line5);
  const line7 = Math.min(inputs.scheduleDLine15, inputs.scheduleDLine16);
  const line8 = Math.min(line3, line4);
  const line9 = atLeast(0, line7 - line8);
  const line10 = line6 + line9;
  const line11 = inputs.scheduleDLine18 + inputs.scheduleDLine19;
  const line12 = Math.min(line9, line11);
  const line13 = line10 - line12;
  const line14 = atLeast(0, line1 - line13);
  const line15 = brackets.zeroRateCeiling;
  const line16 = Math.min(line1, line15);
  const line17 = Math.min(line14, line16);
  const line18 = atLeast(0, line1 - line10);
  const line19 = Math.min(line1, LINE_19_AMOUNT_2025[inputs.filingStatus]);
  const line20 = Math.min(line14, line19);
  const line21 = Math.max(line18, line20);
  const line22 = line16 - line17;
  return {
    ...{ line1, line2, line3, line4, line5, line6, line7, line8, line9, line10, line11 },
    ...{ line12, line13, line14, line15, line16, line17, line18, line19, line20, line21, line22 },
  };
}

type Early = ReturnType<typeof lines1To22>;

interface Middle {
  line23: number;
  line24: number;
  line25: number;
  line26: number;
  line27: number;
  line28: number;
  line29: number;
  line30: number;
  line31: number;
  line32: number;
  /* Lines 33 and 34: skipped when lines 1 and 32 are the same. */
  line33?: number;
  line34?: number;
}

/* Lines 23–34: the 15% and 20% parts. "If lines 1 and 16 are the same, skip lines 23 through 43." */
function lines23To34(inputs: ScheduleDTaxInputs, early: Early): Middle | undefined {
  if (early.line1 === early.line16) return undefined;
  const brackets = lookupPreferentialBrackets(2025, inputs.filingStatus);
  const line23 = Math.min(early.line1, early.line13);
  const line24 = early.line22;
  const line25 = atLeast(0, line23 - line24);
  const line26 = brackets.fifteenRateCeiling;
  const line27 = Math.min(early.line1, line26);
  const line28 = early.line21 + early.line22;
  const line29 = atLeast(0, line27 - line28);
  const line30 = Math.min(line25, line29);
  const line31 = roundDollars(line30 * RATE_15);
  const line32 = line24 + line30;
  // "If lines 1 and 32 are the same, skip lines 33 through 43."
  if (early.line1 === line32) {
    return { line23, line24, line25, line26, line27, line28, line29, line30, line31, line32 };
  }
  const line33 = line23 - line32;
  const line34 = roundDollars(line33 * RATE_20);
  return {
    ...{ line23, line24, line25, line26, line27, line28, line29, line30, line31, line32 },
    ...{ line33, line34 },
  };
}

/* Lines 35–40: the 25% part, skipped when Schedule D line 19 is zero or blank. */
function lines35To40(inputs: ScheduleDTaxInputs, early: Early, middle: Middle) {
  if (middle.line33 === undefined || inputs.scheduleDLine19 <= 0) return undefined;
  const line35 = Math.min(early.line9, inputs.scheduleDLine19);
  const line36 = early.line10 + early.line21;
  const line37 = early.line1;
  const line38 = atLeast(0, line36 - line37);
  const line39 = atLeast(0, line35 - line38);
  return { line35, line36, line37, line38, line39, line40: roundDollars(line39 * RATE_25) };
}

/* Lines 41–43: the 28% part, skipped when Schedule D line 18 is zero or blank. */
function lines41To43(
  inputs: ScheduleDTaxInputs,
  early: Early,
  middle: Middle,
  line39: number | undefined,
) {
  if (middle.line33 === undefined || inputs.scheduleDLine18 <= 0) return undefined;
  const line41 = early.line21 + early.line22 + middle.line30 + middle.line33 + (line39 ?? 0);
  const line42 = early.line1 - line41;
  return { line41, line42, line43: roundDollars(line42 * RATE_28) };
}

/* Throws on a failed tax lookup or an unknown filing status: the caller falls back. */
export function computeScheduleDTax(inputs: ScheduleDTaxInputs): ScheduleDTaxResult {
  const early = lines1To22(inputs);
  const middle = lines23To34(inputs, early);
  const rate25 = middle === undefined ? undefined : lines35To40(inputs, early, middle);
  const rate28 =
    middle === undefined ? undefined : lines41To43(inputs, early, middle, rate25?.line39);
  const line44 = taxByAmount(early.line21, inputs.filingStatus, 2025);
  const line45 =
    (middle?.line31 ?? 0) +
    (middle?.line34 ?? 0) +
    (rate25?.line40 ?? 0) +
    (rate28?.line43 ?? 0) +
    line44;
  const line46 = taxByAmount(early.line1, inputs.filingStatus, 2025);
  const line47 = Math.min(line45, line46);
  const figured = { ...early, ...middle, ...rate25, ...rate28, line44, line45, line46, line47 };
  const breakdown = Object.fromEntries(
    Object.entries(figured).filter(([, value]) => typeof value === "number"),
  ) as ScheduleDTaxBreakdown;
  return { tax: line47, breakdown };
}
