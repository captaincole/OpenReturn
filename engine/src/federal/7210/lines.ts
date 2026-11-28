/*
 * Form 7210 Parts II to IV: pure arithmetic on one facility's production
 * (irs-7210-face-2025::sec::face-part-ii::b01 to face-part-iv::b01). Every
 * line is whole dollars; column (a) is kilograms as stated.
 */

import { roundDollars, sum } from "../../money.js";
import { financingLines } from "../3468/lines.js";

/* The four rows of Part II, by emissions tier. */
export type Tier = "6a" | "6b" | "6c" | "6d";
export const TIERS: ReadonlyArray<Tier> = ["6a", "6b", "6c", "6d"];

/*
 * Column (b), the 2025 applicable amount per kilogram: "$0.637", "$0.213",
 * "$0.159", "$0.127" (irs-7210-face-2025::sec::face-part-ii::b01;
 * irs-7210-inst-2025::sec::applicable-amount::b01: $0.60 adjusted for
 * inflation times 100%, 33.4%, 25%, 20%).
 */
export const APPLICABLE_AMOUNT: Readonly<Record<Tier, number>> = {
  "6a": 0.637,
  "6b": 0.213,
  "6c": 0.159,
  "6d": 0.127,
};

/*
 * The emissions bands, kg CO2e per kg of hydrogen (applicable-amount::b01):
 * "less than 0.45", "0.45 to less than 1.5", "1.5 to less than 2.5", "2.5 to
 * not greater than 4.0". Above 4.0 the hydrogen is not qualified clean hydrogen
 * (irs-7210-inst-2025::sec::apprenticeship-requirements::b02).
 */
export const TIER_A_BELOW = 0.45;
export const TIER_B_BELOW = 1.5;
export const TIER_C_BELOW = 2.5;
export const QUALIFIED_RATE_LIMIT = 4.0;

/* Line 10: "If you checked the box on line 5, multiply the amount on line 9 by 5.0" (face-part-iv::b01). */
export const INCREASED_CREDIT_MULTIPLIER = 5;

/* The row a process's rate falls in; undefined above 4.0 (no credit). */
export function tierOf(emissionsRate: number): Tier | undefined {
  if (emissionsRate < 0) return undefined;
  if (emissionsRate < TIER_A_BELOW) return "6a";
  if (emissionsRate < TIER_B_BELOW) return "6b";
  if (emissionsRate < TIER_C_BELOW) return "6c";
  if (emissionsRate <= QUALIFIED_RATE_LIMIT) return "6d";
  return undefined;
}

export interface ProductionInput {
  emissionsRate: number;
  kilograms: number;
}

export interface ProductionRow {
  /* Column (a). */
  kilograms: number;
  /* Column (c), whole dollars. */
  credit: number;
}

export interface Form7210Lines {
  /* Rows of lines 6a to 6d that have production; absent rows print blank. */
  rows: Partial<Record<Tier, ProductionRow>>;
  line7: number;
  /* Lines 8a to 8d: undefined with no tax-exempt bond financing. */
  bonds?: { ratio: number; line8b: number; line8c: number; line8d: number };
  line9: number;
  /* Line 5 checked. */
  increased: boolean;
  line10: number;
}

/*
 * Lines 6a to 7. Each process goes to the row of its rate; two processes in
 * one row add their kilograms. Column (c) is "Column (a) x Column (b)", whole
 * dollars. Line 7 adds column (c) with the rows' cents and rounds once, as a
 * total of computed rows (CLAUDE.md, Form 4562 line 44; QUESTIONS.md).
 */
export function productionLines(processes: ReadonlyArray<ProductionInput>): {
  rows: Partial<Record<Tier, ProductionRow>>;
  line7: number;
} {
  const kilograms: Partial<Record<Tier, number>> = {};
  for (const process of processes) {
    const tier = tierOf(process.emissionsRate);
    if (tier === undefined || process.kilograms <= 0) continue;
    kilograms[tier] = sum(kilograms[tier] ?? 0, process.kilograms);
  }
  const rows: Partial<Record<Tier, ProductionRow>> = {};
  const exact: number[] = [];
  for (const tier of TIERS) {
    const amount = kilograms[tier];
    if (amount === undefined) continue;
    const product = amount * APPLICABLE_AMOUNT[tier];
    exact.push(product);
    rows[tier] = { kilograms: amount, credit: roundDollars(product) };
  }
  return { rows, line7: roundDollars(sum(...exact)) };
}

/*
 * Part III (irs-7210-inst-2025::sec::credit-reduced-for-tax-exempt-bonds::b01):
 * line 8a the bond proceeds over the capital account additions, 8b line 7 times
 * 8a, 8c line 7 times 15%, 8d the smaller, line 9 line 7 less 8d. With no
 * tax-exempt bonds, "enter the amount from line 7 on line 9"
 * (irs-7210-face-2025::sec::face-part-iii::b01). The arithmetic is Form 3468's
 * (3468/lines.ts, the ratio DECISION there: every digit kept).
 */
export function bondLines(
  line7: number,
  financing: { proceeds: number; capitalAccountAdditions: number } | undefined,
): Pick<Form7210Lines, "bonds" | "line9"> {
  if (financing === undefined) return { line9: line7 };
  const reduced = financingLines(line7, financing.proceeds, financing.capitalAccountAdditions);
  return {
    bonds: {
      ratio: reduced.ratio,
      line8b: reduced.byRatio,
      line8c: reduced.byCap,
      line8d: reduced.reduction,
    },
    line9: reduced.reduced,
  };
}

/* Line 10: line 9 times 5.0 with line 5 checked, else line 9. */
export const line10Of = (line9: number, increased: boolean): number =>
  increased ? line9 * INCREASED_CREDIT_MULTIPLIER : line9;

/* Lines 6a to 10 of one facility. */
export function form7210Lines(
  processes: ReadonlyArray<ProductionInput>,
  financing: { proceeds: number; capitalAccountAdditions: number } | undefined,
  increased: boolean,
): Form7210Lines {
  const production = productionLines(processes);
  const reduced = bondLines(production.line7, financing);
  return { ...production, ...reduced, increased, line10: line10Of(reduced.line9, increased) };
}

/* Line 12: "Add lines 10 and 11"; a copy with neither prints blank. */
export function line12Of(line10: number | undefined, line11: number | undefined) {
  if (line10 === undefined && line11 === undefined) return undefined;
  return sum(line10 ?? 0, line11 ?? 0);
}
