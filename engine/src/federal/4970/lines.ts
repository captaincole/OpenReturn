/*
 * Form 4970 arithmetic, line by line (irs-4970-form-2025::sec::face-part-i::b01,
 * face-part-ii::b01). Whole dollars, rounded to the nearest dollar (money.ts).
 * No facts here: resolveInfo.ts turns the facts into these inputs.
 */

import { atLeast, roundDollars, sum } from "../../money.js";

/* Line 10: "Multiply line 9 by 25% (0.25)". */
export const AVERAGE_SHARE_RATE = 0.25;
/* Line 25: "Divide the line 24 amount by 3.0". */
export const COMPUTATION_YEAR_COUNT = 3;
/* Line 13: "the 5 immediately preceding tax years", columns (a) 2024 to (e) 2020. */
export const LINE_13_YEARS = [2024, 2023, 2022, 2021, 2020] as const;
/* The multiple trust rule applies with "two or more other trusts" (line-4::b01). */
export const MULTIPLE_TRUST_MINIMUM = 2;

/* One throwback year of Schedule J (Form 1041) Part IV, as Part I reads it. */
export interface ThrowbackInput {
  year: number;
  /* Column (a). */
  amount: number;
  /* Column (b). */
  taxes: number;
  /* Column (c). */
  taxExemptInterest: number;
  /* The UNI of the year was accumulated before the beneficiary was born or reached 21 (line-2::b01). */
  beforeAge21: boolean;
  /* The beneficiary counts two or more other trusts in this year (line-4::b01). */
  multipleTrustRule: boolean;
}

export interface PartI {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  /* Lines 9 to 12 are undefined when no year is left on line 8 (QUESTIONS.md). */
  line9?: number;
  line10?: number;
  line11?: number;
  line12?: number;
}

/*
 * DECISION (2026-11-25, by the author): lines 4, 6, 8 and 11 count only the
 * throwback years whose amounts reach line 3. The labels: line 4 "Taxes imposed
 * on the trust on amounts from line 3", line 6 "Tax-exempt interest included on
 * line 5", line 8 "earlier tax years in which amounts on line 7 are considered
 * distributed" (irs-4970-form-2025::sec::face-part-i::b01). The sources the
 * same lines name: "from Schedule J (Form 1041), line 37, column (b)" and
 * "column (c)" (face-part-i::b01), and "counting the 'throwback years' for which
 * there are entries on lines 32 through 36" (line-8::b01). The two differ only
 * when line 2 takes a year out; the engine follows the lines' own definitions,
 * because line 9 averages line 3 over line 8 and the form's arithmetic must hold.
 * The multiple trust rule takes a year's taxes off line 4 only ("don't include
 * on line 4 the taxes", line-4::b01).
 */
export function partI(rows: readonly ThrowbackInput[]): PartI {
  const line1 = roundDollars(sum(...rows.map((row) => row.amount)));
  const line2 = roundDollars(
    sum(...rows.filter((row) => row.beforeAge21).map((row) => row.amount)),
  );
  const line3 = line1 - line2;
  const counted = rows.filter((row) => !row.beforeAge21);
  const taxed = counted.filter((row) => !row.multipleTrustRule);
  const line4 = roundDollars(sum(...taxed.map((row) => row.taxes)));
  const line5 = line3 + line4;
  const line6 = roundDollars(sum(...counted.map((row) => row.taxExemptInterest)));
  const line7 = line5 - line6;
  const line8 = counted.length;
  const lines = { line1, line2, line3, line4, line5, line6, line7, line8 };
  if (line8 === 0) return lines;
  const line9 = roundDollars(line3 / line8);
  const line10 = roundDollars(line9 * AVERAGE_SHARE_RATE);
  // line-11::b01: "subtract any year in which the distribution from column (a) ... is less than the amount on line 10".
  const line11 = line8 - counted.filter((row) => row.amount < line10).length;
  const line12 = line11 > 0 ? roundDollars(line7 / line11) : undefined;
  return { ...lines, line9, line10, line11, line12 };
}

/* Line 13: "If your taxable income as adjusted is less than zero, enter zero" (line-13::b01). */
export const line13Amount = (taxableIncome: number): number =>
  roundDollars(atLeast(0, taxableIncome));

/*
 * Line 14: "Enter the amounts from line 13, eliminating the highest and lowest
 * taxable income years". The kept years' indexes into line 13, in line 13's
 * order. A tie drops the first of the tied years in line 13's order, the most
 * recent (QUESTIONS.md question 3).
 */
export function computationYearIndexes(line13: readonly number[]): number[] {
  const highest = line13.indexOf(Math.max(...line13));
  const rest = line13.map((_, index) => index).filter((index) => index !== highest);
  const lowestAmount = Math.min(...rest.map((index) => line13[index]));
  const lowest = rest.find((index) => line13[index] === lowestAmount);
  return rest.filter((index) => index !== lowest);
}

/* One column of Part II: the stated amounts of the year, and line 17 when it can be figured. */
export interface ColumnInputs {
  year: number;
  line14: number;
  line15: number;
  /* Line 17's tax on line 16; undefined when the engine cannot figure it (the column's gap). */
  taxOnLine16: (line16: number) => number | undefined;
  taxBeforeCredits: number;
  /* Line 20; undefined when the credits do not change. */
  creditIncrease?: number;
  /* Line 22; undefined when the minimum tax does not change. */
  minimumTaxChange?: number;
}

export interface Column {
  year: number;
  line14: number;
  line15: number;
  line16: number;
  line17?: number;
  line18: number;
  line19?: number;
  line20?: number;
  line21?: number;
  line22?: number;
  line23?: number;
}

export function column(inputs: ColumnInputs): Column {
  const line16 = inputs.line14 + inputs.line15;
  const line17 = inputs.taxOnLine16(line16);
  const line18 = roundDollars(inputs.taxBeforeCredits);
  const line20 = roundDollars(inputs.creditIncrease);
  const line22 = roundDollars(inputs.minimumTaxChange);
  const base = { year: inputs.year, line14: inputs.line14, line15: inputs.line15, line16 };
  const stated = { ...base, line18, line20, line22 };
  if (line17 === undefined) return stated;
  const line19 = line17 - line18;
  const line21 = line19 - (line20 ?? 0);
  const line23 = line21 + (line22 ?? 0);
  return { ...stated, line17, line19, line21, line23 };
}

export interface PartIITotals {
  line24: number;
  line25: number;
  line26: number;
  line27: number;
  /* Undefined when estate or generation-skipping transfer tax applies (line-28::b01). */
  line28?: number;
}

/*
 * Lines 24 to 28. Line 26: "Multiply the amount on line 25 by the number of
 * years on line 11"; line 27: "Enter the amount from line 4"; line 28: "If zero
 * or less, enter -0-" (face-part-ii::b01). Undefined while a column's line 23 is.
 */
export function partIITotals(
  columns: readonly Column[],
  line11: number,
  line4: number,
  reducedForTransferTaxes: boolean,
): PartIITotals | undefined {
  const line23 = columns.map((entry) => entry.line23);
  if (line23.some((value) => value === undefined)) return undefined;
  const line24 = sum(...line23);
  const line25 = roundDollars(line24 / COMPUTATION_YEAR_COUNT);
  const line26 = line25 * line11;
  const line27 = line4;
  const totals = { line24, line25, line26, line27 };
  return reducedForTransferTaxes ? totals : { ...totals, line28: atLeast(0, line26 - line27) };
}
