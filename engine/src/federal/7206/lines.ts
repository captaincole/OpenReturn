import type { LongTermCareCoverage } from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/*
 * Line 2 (b): the most of one person's qualified long-term care premiums that
 * count, by the person's age at the end of 2025 (irs-7206-face-2025::sec::face-page-1::b02;
 * irs-7206-inst-2025::sec::general-instructions::b07). Each row is the top age of
 * its band; the last band has no top.
 */
export const LONG_TERM_CARE_LIMITS_2025: ReadonlyArray<{ throughAge: number; limit: number }> = [
  { throughAge: 40, limit: 480 },
  { throughAge: 50, limit: 900 },
  { throughAge: 60, limit: 1800 },
  { throughAge: 70, limit: 4810 },
];
export const LONG_TERM_CARE_LIMIT_71_OR_OLDER_2025 = 6020;

/*
 * Line 6 has no rounding rule ("Divide line 4 by line 5"). The engine keeps 4
 * decimal places, prints them, and line 7 multiplies by the printed value
 * (QUESTIONS.md question 4).
 */
export const RATIO_PLACES = 4;

export function longTermCareLimit(ageAtYearEnd: number): number {
  const band = LONG_TERM_CARE_LIMITS_2025.find((row) => ageAtYearEnd <= row.throughAge);
  return band ? band.limit : LONG_TERM_CARE_LIMIT_71_OR_OLDER_2025;
}

/*
 * Line 2: for each person, the smaller of (a) the payments for that person and
 * (b) the age limit; then the total (the form's line 2). With more than one
 * Form 7206, "the total of the amounts entered for each person on line 2 of all
 * Form(s) 7206 can't be more than the appropriate limit shown on line 2 for that
 * person" (irs-7206-inst-2025::sec::general-instructions::b06): `used` holds what
 * earlier forms took for each person, and this call adds to it. Cents kept, the
 * total rounded.
 */
export function longTermCareLine2(
  coverage: ReadonlyArray<LongTermCareCoverage>,
  used: Map<string, number> = new Map(),
): number {
  const counted = coverage.map((each) => {
    const room = atLeast(0, longTermCareLimit(each.ageAtYearEnd) - (used.get(each.person) ?? 0));
    const amount = Math.min(atLeast(0, each.premiumsPaid), room);
    used.set(each.person, (used.get(each.person) ?? 0) + amount);
    return amount;
  });
  return roundDollars(sum(...counted));
}

/*
 * Line 6: line 4 ÷ line 5, to RATIO_PLACES. A business with no net profit (line
 * 4 of 0 or less) gets 0: line 5 holds only profits, and the form's first test
 * is "a net profit for the year" (irs-7206-inst-2025::sec::general-instructions::b01).
 */
export function profitRatio(line4: number, line5: number): number {
  if (line4 <= 0 || line5 <= 0) return 0;
  return Math.min(1, roundToPlaces(line4 / line5, RATIO_PLACES));
}

/* Line 6 as printed: the ratio with RATIO_PLACES decimals ("1.0000", "0.6250"). */
export function ratioText(ratio: number): string {
  const scaled = roundToPlaces(ratio * 10 ** RATIO_PLACES, 0);
  const scale = 10 ** RATIO_PLACES;
  const fraction = scaled % scale;
  return `${(scaled - fraction) / scale}.${String(fraction).padStart(RATIO_PLACES, "0")}`;
}

/* One Form 7206's lines. Lines 4–10 are blank for an S corporation; line 11 for any other business. */
export interface Form7206Lines {
  line1: number;
  line2: number;
  line3: number;
  line4?: number;
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  /* Blank without Form 2555; 0 or more with it. */
  line12?: number;
  line13: number;
  line14: number;
}

/* Lines 1 and 2, whole dollars, the inputs of every Form 7206. */
export interface PremiumLines {
  line1: number;
  line2: number;
}

/* Line 14: "Enter the smaller of line 3 or line 13" (the form). Never below 0. */
export function deduction(line3: number, line13: number): number {
  return atLeast(0, Math.min(line3, line13));
}

/*
 * Lines 1–10 and 12–14 for a plan under a Schedule C or F business (the form).
 * line15 is Schedule 1 line 15 (the deductible part of self-employment tax),
 * line9 the part of Schedule 1 line 16 for this business, line12 Form 2555's
 * attributable amount (undefined without Form 2555). Whole dollars in, whole out.
 */
export function businessPlanLines(args: {
  premiums: PremiumLines;
  line4: number;
  line5: number;
  line15: number;
  line9: number;
  line12?: number;
}): Form7206Lines {
  const { premiums, line4, line5, line15, line9, line12 } = args;
  const line3 = premiums.line1 + premiums.line2;
  const line6 = profitRatio(line4, line5);
  const line7 = roundDollars(line15 * line6);
  const line8 = line4 - line7;
  const line10 = line8 - line9;
  const line13 = line10 - (line12 ?? 0);
  return {
    ...premiums,
    line3,
    line4,
    line5,
    line6,
    line7,
    line8,
    line9,
    line10,
    line12,
    line13,
    line14: deduction(line3, line13),
  };
}

/*
 * Lines 1–3 and 11–14 for a plan under an S corporation: line 4 says "If the
 * business is an S corporation, skip to line 11", and line 13 subtracts line 12
 * from line 11 (the form).
 */
export function sCorporationPlanLines(args: {
  premiums: PremiumLines;
  line11: number;
  line12?: number;
}): Form7206Lines {
  const { premiums, line11, line12 } = args;
  const line3 = premiums.line1 + premiums.line2;
  const line13 = line11 - (line12 ?? 0);
  return { ...premiums, line3, line11, line12, line13, line14: deduction(line3, line13) };
}
