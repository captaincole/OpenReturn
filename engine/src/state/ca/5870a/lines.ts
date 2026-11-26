/*
 * FTB 5870A arithmetic, line by line (ca-5870a-face-2025::sec::face-part-i::b01,
 * face-part-ii::b01, face-part-iii::b01). Whole dollars, rounded to the nearest
 * dollar (money.ts). No facts here: assemble.ts turns the facts into these inputs.
 */

import { computationYearIndexes } from "../../../federal/4970/lines.js";
import { atLeast, roundDollars, sum } from "../../../money.js";

export { computationYearIndexes };

/* Part I line 8: "Multiply line 7 by 25% (.25)". */
export const AVERAGE_SHARE_RATE = 0.25;
/* Part I line 23: "Divide the amount on line 22 by 3". */
export const COMPUTATION_YEAR_COUNT = 3;
/* Part I line 11 and Part II Section A: the five preceding years, columns (a) 2024 to (e) 2020. */
export const PRECEDING_YEARS = [2024, 2023, 2022, 2021, 2020] as const;
/* Part II Section A line 2: "Divide line 1 by six". */
export const SECTION_A_DIVISOR = 6;
/* Part II: "accumulated over a period of five taxable years or more, complete Section A". */
export const SECTION_A_MINIMUM_YEARS = 5;
/* Part II Section B line 2b: "Distribution year ... 1". */
export const DISTRIBUTION_YEAR = 1;
/* Part III line 2: "Subtract 1,000,000 from line 1"; line 3: "Multiply line 2 by 1%". */
export const BEHAVIORAL_HEALTH_TAX_FLOOR = 1_000_000;
export const BEHAVIORAL_HEALTH_TAX_RATE = 0.01;
/* The multiple trust rule applies with "two or more other trusts" (part-i-tax-on-accumulation-distribution::b03). */
export const MULTIPLE_TRUST_MINIMUM = 2;

/* One throwback year of Schedule J (541) Part IV, as Part I reads it. */
export interface ThrowbackInput {
  year: number;
  /* Column (a). */
  amount: number;
  /* Column (b). */
  taxes: number;
  /* Column (c). */
  taxExemptInterest: number;
  /* The beneficiary counts two or more other trusts in this year. */
  multipleTrustRule: boolean;
}

export interface PartISectionA {
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
}

/* No throwback year left (every year before age 21): nothing to average. */
const ZERO_SECTION_A: PartISectionA = {
  line1: 0,
  line2: 0,
  line3: 0,
  line4: 0,
  line5: 0,
  line6: 0,
  line7: 0,
  line8: 0,
  line9: 0,
  line10: 0,
};

/* With no throwback year left, no year is recomputed and the partial tax is 0 (QUESTIONS.md). */
export const NO_YEAR_TOTALS: PartITotals = {
  line22: 0,
  line23: 0,
  line24: 0,
  line25: 0,
  line26: 0,
};

/*
 * Part I lines 1 to 10. Line 2 leaves out the taxes of a year under the
 * multiple trust rule ("do not include on line 2 the taxes attributable to the
 * current accumulation distribution considered to have been distributed in the
 * same earlier taxable years", part-i-tax-on-accumulation-distribution::b03).
 * Line 9: "subtract any year in which the distribution from Schedule J (541),
 * Part IV, column (a) is less than the amount on line 8" (::b04). At least one
 * row is never below the average, so line 9 is at least 1.
 */
export function partISectionA(rows: readonly ThrowbackInput[]): PartISectionA {
  const line1 = roundDollars(sum(...rows.map((row) => row.amount)));
  const taxed = rows.filter((row) => !row.multipleTrustRule);
  const line2 = roundDollars(sum(...taxed.map((row) => row.taxes)));
  const line3 = line1 + line2;
  const line4 = roundDollars(sum(...rows.map((row) => row.taxExemptInterest)));
  const line5 = line3 - line4;
  const line6 = rows.length;
  if (line6 === 0) return { ...ZERO_SECTION_A, line2, line3, line4, line5 };
  const line7 = roundDollars(line1 / line6);
  const line8 = roundDollars(line7 * AVERAGE_SHARE_RATE);
  const line9 = line6 - rows.filter((row) => row.amount < line8).length;
  const line10 = roundDollars(line5 / line9);
  return { line1, line2, line3, line4, line5, line6, line7, line8, line9, line10 };
}

/* Part I line 11: "enter the amount of your taxable income, but not less than zero" (::b05). */
export const taxableIncomeAmount = (taxableIncome: number): number =>
  roundDollars(atLeast(0, taxableIncome));

/*
 * One year's column of the recomputation. The rows are the same in each part:
 * Part I lines 12 to 21, Part II Section A lines 4 to 13, Section B lines 6 to 15.
 */
export interface YearColumnInputs {
  year: number;
  /* Part I line 12; Part II Section A line 4; Section B line 6. */
  taxableIncome: number;
  /* Part I line 13; Section A line 5; Section B line 7. */
  share: number;
  /* The year's tax on the recomputed income; undefined when the engine cannot figure it. */
  taxOn: (income: number) => number | undefined;
  /* Part I line 16; Section A line 8; Section B line 10. */
  taxBeforeCredits: number;
  /* Above 0: the allowable credits go up; below 0: down; undefined: no change. */
  creditChange?: number;
  /* Part I line 20; Section A line 12; Section B line 14. */
  minimumTaxChange?: number;
}

export interface YearColumn {
  year: number;
  taxableIncome: number;
  share: number;
  /* Part I line 14; Section A line 6; Section B line 8. */
  recomputed: number;
  /* Part I line 15; Section A line 7; Section B line 9. */
  tax?: number;
  taxBeforeCredits: number;
  /* Part I line 17; Section A line 9; Section B line 11. */
  additionalTax?: number;
  /* Part I line 18; Section A line 10; Section B line 12: the size of the net change. */
  creditAdjustment?: number;
  /* Part I line 19; Section A line 11; Section B line 13. */
  afterCredits?: number;
  minimumTaxChange?: number;
  /* Part I line 21; Section A line 13; Section B line 15. */
  total?: number;
}

/*
 * The column. The credit line holds the size of the change; the next line
 * subtracts it when the credits go up and adds it when they go down ("If the
 * net change results in an increase in allowable credits, subtract line 18
 * from line 17. If ... a decrease in allowable credits, add line 18 and line
 * 17", part-i-tax-on-accumulation-distribution::b05; section-a::b03).
 */
export function yearColumn(inputs: YearColumnInputs): YearColumn {
  const taxableIncome = roundDollars(inputs.taxableIncome);
  const recomputed = taxableIncome + inputs.share;
  const taxBeforeCredits = roundDollars(inputs.taxBeforeCredits);
  const change = roundDollars(inputs.creditChange);
  const creditAdjustment = change === undefined ? undefined : Math.abs(change);
  const minimumTaxChange = roundDollars(inputs.minimumTaxChange);
  const stated = {
    year: inputs.year,
    taxableIncome,
    share: inputs.share,
    recomputed,
    taxBeforeCredits,
    creditAdjustment,
    minimumTaxChange,
  };
  const tax = inputs.taxOn(recomputed);
  if (tax === undefined) return stated;
  const additionalTax = tax - taxBeforeCredits;
  const afterCredits = additionalTax - (change ?? 0);
  const total = afterCredits + (minimumTaxChange ?? 0);
  return { ...stated, tax, additionalTax, afterCredits, total };
}

export interface PartITotals {
  line22: number;
  line23: number;
  line24: number;
  line25: number;
  line26: number;
}

/*
 * Part I lines 22 to 26: "Add column (a), column (b), and column (c) of line
 * 21"; "Divide ... by 3"; "Multiply ... by the number of taxable years on line
 * 9"; "Enter the amount from line 2"; "Subtract line 25 from line 24. If zero or
 * less, enter -0-" (face-part-i::b01). Undefined while a column's line 21 is.
 */
export function partITotals(
  columns: readonly YearColumn[],
  sectionA: PartISectionA,
): PartITotals | undefined {
  const totals = columns.map((entry) => entry.total);
  if (totals.some((value) => value === undefined)) return undefined;
  const line22 = sum(...totals);
  const line23 = roundDollars(line22 / COMPUTATION_YEAR_COUNT);
  const line24 = line23 * sectionA.line9;
  const line25 = sectionA.line2;
  return { line22, line23, line24, line25, line26: atLeast(0, line24 - line25) };
}

/* Part II Section A lines 1 and 2: the amount included this year (line 2). */
export const sectionAShare = (distribution: number) => {
  const line1 = roundDollars(distribution);
  return { line1, line2: roundDollars(line1 / SECTION_A_DIVISOR) };
};

/* Part II Section B lines 1 to 4: line 3 adds the distribution year to the years on line 2a. */
export const sectionBShare = (distribution: number, years: number) => {
  const line1 = roundDollars(distribution);
  const line3 = years + DISTRIBUTION_YEAR;
  return { line1, line2a: years, line3, line4: roundDollars(line1 / line3) };
};

/*
 * Part II Section A line 14, Section B line 16: "Add line 13, column (a)
 * through column (e) for all taxable years that you checked 'Yes'" (section-a::b04,
 * section-b::b03). Undefined while a "Yes" column's total is.
 */
export function partIITotal(yesColumns: readonly YearColumn[]): number | undefined {
  const totals = yesColumns.map((entry) => entry.total);
  return totals.some((value) => value === undefined) ? undefined : sum(...totals);
}

export interface PartIIIColumn {
  year: number;
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
}

/* Part III lines 1 to 5 of one "Yes" year (section-a-2::b01, section-b-2::b01). */
export function partIIIColumn(year: number, recomputed: number, paid: number): PartIIIColumn {
  const line2 = atLeast(0, recomputed - BEHAVIORAL_HEALTH_TAX_FLOOR);
  const line3 = roundDollars(line2 * BEHAVIORAL_HEALTH_TAX_RATE);
  const line4 = roundDollars(paid);
  return { year, line1: recomputed, line2, line3, line4, line5: line3 - line4 };
}

/*
 * Part III is completed "if the recomputed taxable income in either Part II,
 * Section A, line 6 or Section B, line 8 is more than $1,000,000"
 * (part-ii-tax-on-distributions-of-previously-untaxed-trust-income::b01).
 */
export const partIIIApplies = (yesColumns: readonly YearColumn[]): boolean =>
  yesColumns.some((entry) => entry.recomputed > BEHAVIORAL_HEALTH_TAX_FLOOR);

/* Part III line 6: "Add line 5, columns (a) through (e)". */
export const partIIITotal = (columns: readonly PartIIIColumn[]): number =>
  sum(...columns.map((entry) => entry.line5));
