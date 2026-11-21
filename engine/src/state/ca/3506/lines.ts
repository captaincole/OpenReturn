/*
 * FTB 3506 arithmetic, pure: numbers in, line values out. bindings.ts,
 * partIII.ts and partIV.ts read the inputs and call these; figurePartIII and
 * figurePartIV chain them for the unit tests.
 */

import type { CaPriorYearDependentCareFactValue } from "../../../facts/index.js";
import { creditPercent, expenseLimit } from "../../../federal/2441/lines.js";
import { atLeast, roundDollars, sum } from "../../../money.js";

/*
 * Qualification 8 (ca-3506-inst-2025::sec::c-qualifications::b02) and the
 * line 9 chart's last row (ca-3506-inst-2025::sec::line-9::b02): "Over $100,000 —
 * Stop. You do not qualify for this credit."
 */
export const FEDERAL_AGI_LIMIT = 100_000;

/*
 * Line 9 chart (ca-3506-inst-2025::sec::line-9::b02), read with federal AGI from
 * Form 540 line 13 (the chart's column header): the California percent of the federal credit.
 */
const CALIFORNIA_PERCENT_BANDS = [
  { agiUpTo: 40_000, percent: 50 },
  { agiUpTo: 70_000, percent: 43 },
  { agiUpTo: FEDERAL_AGI_LIMIT, percent: 34 },
];

/* Part I prints three rows of two sources (the blank form). */
export const PART_I_SLOTS = 6;
/* Part II line 1 prints two provider columns; line 2 prints three persons (the blank form). */
export const PROVIDER_COLUMNS = 2;
export const PERSON_ROWS = 3;

/*
 * Line 7 (ca-3506-inst-2025::sec::line-7::b02): the federal chart, 35% through
 * $15,000 and one point less for each $2,000 band down to 20%. It is the Form
 * 2441 line 8 table (irs-pub-503-2025::sec::randall-s-reduced-dollar-limit::b01).
 */
export const federalPercent = creditPercent;

/* Line 9: the California percent; undefined over $100,000 ("Stop"). */
export function californiaPercent(federalAgi: number): number | undefined {
  return CALIFORNIA_PERCENT_BANDS.find((band) => federalAgi <= band.agiUpTo)?.percent;
}

/* Lines 3 and 28, worksheet line 4: $3,000 for one qualifying person, $6,000 for two or more. */
export const dollarLimit = expenseLimit;

/* Line 3 without Part IV: column (e)'s total, at most the dollar limit. */
export function line3(columnE: number[]): number {
  return Math.min(sum(...columnE), dollarLimit(columnE.length));
}

/* Line 6: the smallest of lines 3, 4 and 5; a loss leaves 0. */
export function line6(line3Amount: number, yours: number, spouse: number): number {
  return atLeast(0, Math.min(line3Amount, yours, spouse));
}

/* Line 8: line 6 times the line 7 decimal, whole dollars. */
export function line8(line6Amount: number, federalAgi: number): number {
  return roundDollars((line6Amount * federalPercent(federalAgi)) / 100);
}

/* Line 10: line 8 times the line 9 decimal; undefined over $100,000 of AGI. */
export function line10(line8Amount: number, federalAgi: number): number | undefined {
  const percent = californiaPercent(federalAgi);
  return percent === undefined ? undefined : roundDollars((line8Amount * percent) / 100);
}

/* Part IV, the amounts the lines start from. */
export interface PartIVInputs {
  line13: number;
  line14: number;
  line15: number;
  line17: number;
  line19: number;
  line20: number;
  line22: number;
  line23: number;
}

/* Line 16: "Combine line 13 through line 15": the forfeited line 15 is taken away. */
export const line16 = (line13: number, line14: number, line15: number) => line13 + line14 - line15;
/* Lines 18 and 21: the smaller or smallest of the lines named; line 21 is at least 0. */
export const line18 = (line16Amount: number, line17: number) => Math.min(line16Amount, line17);
export const line21 = (line18Amount: number, line19: number, line20: number) =>
  atLeast(0, Math.min(line18Amount, line19, line20));
export const line24 = (line16Amount: number, line23: number) => line16Amount - line23;
/* Line 25, deductible benefits: the smallest of lines 21, 22 and 23. */
export const line25 = (line21Amount: number, line22: number, line23: number) =>
  Math.min(line21Amount, line22, line23);
/* Line 26, excluded benefits: the smaller of lines 21 and 22, less line 25, at least 0. */
export const line26 = (line21Amount: number, line22: number, line25Amount: number) =>
  atLeast(0, Math.min(line21Amount, line22) - line25Amount);
/* Line 27, taxable benefits: line 24 less line 26, at least 0. */
export const line27 = (line24Amount: number, line26Amount: number) =>
  atLeast(0, line24Amount - line26Amount);
export const line29 = (line25Amount: number, line26Amount: number) => line25Amount + line26Amount;
/* Line 30: line 28 less line 29; "If zero or less, stop" prints 0. */
export const line30 = (line28: number, line29Amount: number) => atLeast(0, line28 - line29Amount);
export const line33 = (line30Amount: number, line31: number, line32: number) =>
  Math.min(line30Amount, line31, line32);

export interface PartIVLines {
  line16: number;
  line18: number;
  line21: number;
  line24: number;
  line25: number;
  line26: number;
  line27: number;
  line28: number;
  line29: number;
  line30: number;
}

/* Lines 16 to 30 from the Part IV inputs and the number of qualifying persons. */
export function figurePartIV(input: PartIVInputs, personCount: number): PartIVLines {
  const l16 = line16(input.line13, input.line14, input.line15);
  const l18 = line18(l16, input.line17);
  const l21 = line21(l18, input.line19, input.line20);
  const l24 = line24(l16, input.line23);
  const l25 = line25(l21, input.line22, input.line23);
  const l26 = line26(l21, input.line22, l25);
  const l28 = dollarLimit(personCount);
  const l29 = line29(l25, l26);
  return {
    line16: l16,
    line18: l18,
    line21: l21,
    line24: l24,
    line25: l25,
    line26: l26,
    line27: line27(l24, l26),
    line28: l28,
    line29: l29,
    line30: line30(l28, l29),
  };
}

/* Worksheet lines 1 to 15; a line after a stop is absent, and credit is line 15 or 0. */
export interface WorksheetLines {
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
  line11?: number;
  line12?: number;
  line13?: number;
  line14?: number;
  line15?: number;
  credit: number;
}

/*
 * The Worksheet – Credit for 2024 Expenses Paid in 2025 (the form, Side 2;
 * ca-3506-inst-2025::sec::line-11::b01, ::line-12::b01, ::line-14-2::b01).
 * Line 7 is the smaller spouse's 2024 earned income on a joint return, else
 * the taxpayer's; line 8 is the smallest of lines 3, 6 and 7 (QUESTIONS.md).
 * The 2024 charts are the 2025 ones (QUESTIONS.md). Line 10 zero or less, or
 * 2024 California AGI over $100,000 on line 14, stops: no credit.
 */
export function figureWorksheet(
  answers: CaPriorYearDependentCareFactValue,
  paidIn2025: number,
  joint: boolean,
): WorksheetLines | undefined {
  const yours = roundDollars(answers.yourEarnedIncome);
  const spouse = roundDollars(answers.spouseEarnedIncome);
  if (joint && spouse === undefined) return undefined;
  const line1 = roundDollars(answers.expensesPaidIn2024);
  const line2 = roundDollars(paidIn2025);
  const line4 = dollarLimit(answers.qualifyingPersons);
  const line5 = roundDollars(answers.excludedBenefits);
  const line7 = joint ? Math.min(yours, spouse as number) : yours;
  const line8 = Math.min(line1 + line2, line4 - line5, line7);
  const line9 = roundDollars(answers.priorYearLine6);
  const lines = {
    ...{ line1, line2, line3: line1 + line2, line4, line5, line6: line4 - line5, line7, line8 },
    ...{ line9, line10: atLeast(0, line8 - line9) },
  };
  if (lines.line10 <= 0) return { ...lines, credit: 0 };
  const line11 = roundDollars(answers.federalAgi);
  const line12 = federalPercent(line11);
  const line13 = roundDollars((lines.line10 * line12) / 100);
  const line14 = californiaPercent(roundDollars(answers.californiaAgi));
  if (line14 === undefined) return { ...lines, line11, line12, line13, credit: 0 };
  const line15 = roundDollars((line13 * line14) / 100);
  return { ...lines, line11, line12, line13, line14, line15, credit: line15 };
}

/* Part III's inputs, for figurePartIII. */
export interface PartIIIInputs {
  columnE: number[];
  /* Line 33 when Part IV is completed. */
  partIVLine33?: number;
  yourEarnedIncome: number;
  spouseEarnedIncome: number;
  federalAgi: number;
  priorYearCredit: number;
}

export interface PartIIILines {
  line3: number;
  line6: number;
  line7: number;
  line8: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12: number;
}

/* Lines 3 to 12 chained; over $100,000 of AGI, line 9 stops and line 12 is 0. */
export function figurePartIII(input: PartIIIInputs): PartIIILines {
  const l3 = input.partIVLine33 ?? line3(input.columnE);
  const l6 = line6(l3, input.yourEarnedIncome, input.spouseEarnedIncome);
  const l8 = line8(l6, input.federalAgi);
  const l10 = line10(l8, input.federalAgi);
  const base = { line3: l3, line6: l6, line7: federalPercent(input.federalAgi), line8: l8 };
  if (l10 === undefined) return { ...base, line12: 0 };
  return {
    ...base,
    line9: californiaPercent(input.federalAgi),
    line10: l10,
    line11: input.priorYearCredit,
    line12: l10 + input.priorYearCredit,
  };
}
