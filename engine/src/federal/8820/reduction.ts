/*
 * The section 280C(b) reduction on the clinical testing business's Schedule C:
 * without the reduced credit election, the deduction for the expenses goes
 * down by line 2a (lines.ts deductionReductionOf).
 *
 * DECISION (2026-11-27, by the author): the reduction comes off the Schedule C
 * lines that hold the clinical testing expenses, in a fixed order, each line by
 * at most the expenses of its kind.
 * Text A, the form's instructions, leave the lines to the taxpayer: "reduce
 * your otherwise allowable deduction for qualified clinical testing expenses
 * by the amount of the credit ... Identify the lines of your return ... on
 * which the reductions were made" (irs-8820-form-2025::sec::line-2a::b02).
 * Text B, the Schedule C instructions, name no line for this credit: line 26
 * lists the wage credits it reduces (irs-1040sc-inst-2025::sec::line-26::b01),
 * and the orphan drug credit is not among them.
 * The engine takes it off line 26 (wages), then line 22 (supplies), line 20a
 * (the computer rental) and line 11 (contract testing): one rule, the same
 * every time, on the lines that hold the expenses, in the order the research
 * credit's Section F lists the same kinds. A reduction those lines cannot
 * hold is a gap (figures.ts).
 */

import type { BusinessExpenses } from "../../facts/kinds/business.js";
import type { ClinicalTestingExpenses } from "../../facts/kinds/orphanDrugCredit.js";
import { atLeast, sum } from "../../money.js";

export type ReducedExpenseLine = "wages" | "supplies" | "rentVehiclesMachinery" | "contractLabor";

/* Each Schedule C line the reduction can use, with the kind of expense it holds. */
export const REDUCTION_ORDER: ReadonlyArray<{
  line: ReducedExpenseLine;
  kind: keyof ClinicalTestingExpenses;
}> = [
  { line: "wages", kind: "wages" },
  { line: "supplies", kind: "supplies" },
  { line: "rentVehiclesMachinery", kind: "computerRental" },
  { line: "contractLabor", kind: "contractTesting" },
];

export interface PlacedReduction {
  /* The amount taken off each line; a line with nothing taken is not listed. */
  byLine: Partial<Record<ReducedExpenseLine, number>>;
  /* The part of the reduction no line could take. */
  left: number;
}

/* The reduction, line by line in REDUCTION_ORDER; no line goes below 0, and no line gives more than its kind. */
export function placeReduction(
  stated: BusinessExpenses | undefined,
  reduction: number,
  expenses: ClinicalTestingExpenses,
): PlacedReduction {
  const byLine: Partial<Record<ReducedExpenseLine, number>> = {};
  let left = reduction;
  for (const { line, kind } of REDUCTION_ORDER) {
    const room = Math.min(atLeast(0, stated?.[line] ?? 0), atLeast(0, expenses[kind] ?? 0));
    const taken = Math.min(left, room);
    if (taken <= 0) continue;
    byLine[line] = taken;
    left -= taken;
  }
  return { byLine, left: atLeast(0, left) };
}

/* The total a placement takes off. */
export const placedTotal = (placed: PlacedReduction): number =>
  sum(...Object.values(placed.byLine));
