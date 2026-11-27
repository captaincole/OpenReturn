/*
 * The section 280C reduction on the research business's Schedule C: without
 * the reduced credit election, the deduction for the research expenses goes
 * down by Form 6765 line 28 (figures.ts deductionReductionOf).
 *
 * DECISION (2026-11-27, by the author): the reduction comes off the Schedule
 * C lines that hold the research expenses, in the order of Section F, each
 * line by at most what the business paid in that category.
 * - The instructions leave the lines to the taxpayer: "reduce your domestic
 *   research or experimental expenditures under section 174A otherwise taken
 *   into account as a deduction ... by the amount of the research credit",
 *   and "Identify the lines of your return (schedule or forms for capitalized
 *   items) on which the reductions were made"
 *   (irs-6765-inst-2025::sec::item-a-section-280c-election::b01, ::b02).
 * - The Schedule C instructions name no line for the research credit: line 26
 *   lists the wage credits it reduces (irs-1040sc-inst-2025::sec::line-26::b01),
 *   and the research credit is not among them.
 * The engine takes it off line 26 (wages, Section F line 42), then line 22
 * (supplies, line 43), line 20a (rent of machinery and equipment, the computer
 * rental of line 44) and line 11 (contract labor, the contract research of
 * line 45, as paid): one rule, the same every time, on the lines that hold the
 * expenditures. A reduction that these lines cannot hold is a gap on line 28.
 */

import type { BusinessExpenses } from "../../facts/kinds/business.js";
import { atLeast } from "../../money.js";
import type { PaidByCategory } from "./qualifiedExpenses.js";

type ExpenseLine = "wages" | "supplies" | "rentVehiclesMachinery" | "contractLabor";

/* Each Schedule C line the reduction can use, with the Section F category it holds. */
export const REDUCTION_ORDER: ReadonlyArray<{ line: ExpenseLine; category: keyof PaidByCategory }> =
  [
    { line: "wages", category: "wages" },
    { line: "supplies", category: "supplies" },
    { line: "rentVehiclesMachinery", category: "computerRental" },
    { line: "contractLabor", category: "contractResearch" },
  ];

export interface PlacedReduction {
  expenses: BusinessExpenses;
  /* The part of the reduction no line could take. */
  left: number;
}

/* The business's expenses less the reduction, line by line in REDUCTION_ORDER; no line goes below 0. */
export function placeReduction(
  expenses: BusinessExpenses | undefined,
  reduction: number,
  paid: PaidByCategory,
): PlacedReduction {
  const reduced: BusinessExpenses = { ...expenses };
  let left = reduction;
  for (const { line, category } of REDUCTION_ORDER) {
    const stated = expenses?.[line];
    if (left <= 0 || stated === undefined) continue;
    const taken = Math.min(left, atLeast(0, stated), atLeast(0, paid[category]));
    reduced[line] = stated - taken;
    left -= taken;
  }
  return { expenses: reduced, left: atLeast(0, left) };
}
