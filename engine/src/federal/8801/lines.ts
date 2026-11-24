/*
 * Form 8801 lines 1–21: pure arithmetic on the 2024 amounts. Every amount and
 * rate here is the 2024 one the 2025 form prints (the blank form, lines 4–11,
 * 33, 34, 40, 54). Part III is in partIII.ts. Each line is a whole dollar.
 */

import { atLeast, roundDollars, sum } from "../../money.js";
import type { FilingStatus } from "../../values.js";

/* The 2024 amounts for one filing status (the blank form, lines 5, 6, 34 and 40). */
export interface Year2024Amounts {
  /* Line 5. */
  exemption: number;
  /* Line 6. */
  phaseOutStart: number;
  /* Line 34: the top of the 0% capital gain rate. */
  zeroRateCeiling: number;
  /* Line 40: the top of the 15% capital gain rate. */
  fifteenRateCeiling: number;
}

const SINGLE: Year2024Amounts = {
  exemption: 85_700,
  phaseOutStart: 609_350,
  zeroRateCeiling: 47_025,
  fifteenRateCeiling: 518_900,
};
const JOINT: Year2024Amounts = {
  exemption: 133_300,
  phaseOutStart: 1_218_700,
  zeroRateCeiling: 94_050,
  fifteenRateCeiling: 583_750,
};
const SEPARATE: Year2024Amounts = {
  exemption: 66_650,
  phaseOutStart: 609_350,
  zeroRateCeiling: 47_025,
  fifteenRateCeiling: 291_850,
};
const HEAD_OF_HOUSEHOLD: Year2024Amounts = {
  exemption: 85_700,
  phaseOutStart: 609_350,
  zeroRateCeiling: 63_000,
  fifteenRateCeiling: 551_350,
};

export const AMOUNTS_2024: Record<FilingStatus, Year2024Amounts> = {
  single: SINGLE,
  married_filing_jointly: JOINT,
  qualifying_surviving_spouse: JOINT,
  married_filing_separately: SEPARATE,
  head_of_household: HEAD_OF_HOUSEHOLD,
};

/* Line 8: "Multiply line 7 by 25% (0.25)". */
export const EXEMPTION_PHASE_OUT_RATE = 0.25;

/*
 * Line 4's married-filing-separately add-on (irs-8801-inst-2025::sec::line-4::b01):
 * over $875,950, add 25% of the excess; at $1,142,550 or more, add $66,650.
 */
export const MFS_ADD_ON_START = 875_950;
export const MFS_ADD_ON_MAX = 66_650;
export const MFS_ADD_ON_RATE = 0.25;

/* Lines 11, 33 and 54: 26% up to the break, else 28% less the subtraction (2024 amounts). */
export const AMT_LOW_RATE = 0.26;
export const AMT_HIGH_RATE = 0.28;
export const AMT_RATE_BREAK = 232_600;
export const AMT_RATE_BREAK_MFS = 116_300;
export const AMT_HIGH_RATE_SUBTRACTION = 4_652;
export const AMT_HIGH_RATE_SUBTRACTION_MFS = 2_326;

/* Lines 11, 33 and 54: the tax on an amount at the 2024 AMT rates. */
export function taxAtAmtRates(amount: number, status: FilingStatus): number {
  const separate = status === "married_filing_separately";
  if (amount <= (separate ? AMT_RATE_BREAK_MFS : AMT_RATE_BREAK)) {
    return roundDollars(amount * AMT_LOW_RATE);
  }
  const subtraction = separate ? AMT_HIGH_RATE_SUBTRACTION_MFS : AMT_HIGH_RATE_SUBTRACTION;
  return roundDollars(amount * AMT_HIGH_RATE - subtraction);
}

/* Line 4 with the add-on, for a 2024 married-filing-separately return (line-4::b01). */
export function withSeparateAddOn(combined: number, status: FilingStatus): number {
  if (status !== "married_filing_separately" || combined <= MFS_ADD_ON_START) return combined;
  const addOn = roundDollars((combined - MFS_ADD_ON_START) * MFS_ADD_ON_RATE);
  return combined + Math.min(MFS_ADD_ON_MAX, addOn);
}

/* Lines 1–10. A line the form skips is undefined. */
export interface Lines1To10 {
  line1: number;
  line2: number;
  /* The deduction, a positive amount the form prints in parentheses; undefined when none. */
  line3?: number;
  line4: number;
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
}

/*
 * Lines 1–10 (the blank form). Line 4 combines lines 1, 2 and 3 (3 subtracts);
 * "If zero or less, enter -0- here and on line 15 and go to Part II", so
 * lines 5–10 are blank. Line 7: "If zero or less, enter -0- here and on line 8."
 * Line 10: "If zero or less, enter -0- here and on line 15 and go to Part II."
 */
export function lines1To10(
  status: FilingStatus,
  line1: number,
  line2: number,
  line3: number | undefined,
): Lines1To10 {
  const combined = line1 + line2 - sum(line3);
  if (combined <= 0) return { line1, line2, line3, line4: 0 };
  const line4 = withSeparateAddOn(combined, status);
  const amounts = AMOUNTS_2024[status];
  const line7 = atLeast(0, line4 - amounts.phaseOutStart);
  const line8 = line7 === 0 ? 0 : roundDollars(line7 * EXEMPTION_PHASE_OUT_RATE);
  const line9 = atLeast(0, amounts.exemption - line8);
  return {
    line1,
    line2,
    line3,
    line4,
    line5: amounts.exemption,
    line6: amounts.phaseOutStart,
    line7,
    line8,
    line9,
    line10: atLeast(0, line4 - line9),
  };
}

/* Lines 11–15, once line 10 is above 0. */
export interface Lines11To15 {
  line11: number;
  /* Blank when there is no minimum tax foreign tax credit. */
  line12?: number;
  line13: number;
  line14: number;
  line15: number;
}

/*
 * Line 13 = line 11 − line 12; line 15 = line 13 − line 14, "If zero or less,
 * enter -0-" (the blank form).
 */
export function lines11To15(
  line11: number,
  line12: number | undefined,
  line14: number,
): Lines11To15 {
  const line13 = line11 - sum(line12);
  return { line11, line12, line13, line14, line15: atLeast(0, line13 - line14) };
}

/* Lines 16–21 (Part II, the 2024 amounts). */
export interface Lines16To21 {
  line16: number;
  line17: number;
  line18: number;
  /* Blank when there is no 2024 carryforward. */
  line19?: number;
  /* Blank when there is no unallowed credit. */
  line20?: number;
  line21: number;
}

/*
 * Line 18 = line 16 − line 17, "If less than zero, enter as a negative amount".
 * Line 21 combines lines 18 through 20 (the blank form).
 */
export function lines16To21(
  line15: number,
  line16: number,
  line19: number | undefined,
  line20: number | undefined,
): Lines16To21 {
  const line18 = line16 - line15;
  return {
    line16,
    line17: line15,
    line18,
    line19,
    line20,
    line21: line18 + sum(line19, line20),
  };
}

/* Lines 24–26, once lines 21, 22 and 23 are known. */
export interface Lines24To26 {
  line24: number;
  line25: number;
  line26: number;
}

/*
 * Line 24 = line 22 − line 23, "If zero or less, enter -0-". Line 25, the
 * credit, is the smaller of lines 21 and 24. Line 26, the carryforward to 2026,
 * is line 21 − line 25 (the blank form).
 */
export function lines24To26(line21: number, line22: number, line23: number): Lines24To26 {
  const line24 = atLeast(0, line22 - line23);
  const line25 = Math.min(line21, line24);
  return { line24, line25, line26: line21 - line25 };
}
