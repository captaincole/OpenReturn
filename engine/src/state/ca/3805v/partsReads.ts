/*
 * Parts II and III from the return: Part II prints when a prior year carryover
 * is on the form ("Use this part if: You are carrying over an NOL ... a
 * disaster loss from years prior to 2025 ... an unused 2025 disaster loss",
 * ca-3805v-inst-2025::sec::part-ii-modified-taxable-income-mti::b01); Part III
 * adds the current year NOL (line 4) to the carryovers to 2026.
 */

import type { Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import {
  CA_AGI,
  capitalLossDeductionOf,
  carryoverDeductions,
  deductionOf,
  figuresOf,
  itemizedAdjustment,
  type Info,
  type Read,
} from "./figures.js";
import { currentYearNol, partII, type Amount, type PartIILines } from "./lines.js";
import { carryoverTotals } from "./partIII.js";
import { disasterLossOf, sectionALinesOf } from "./sectionAReads.js";

/* Part III line 3's 2025 disaster loss: 0 for none, or the gap (sectionAReads.ts). */
export function currentDisasterOf(form: Read, info: Info): Amount | undefined {
  const deduction = deductionOf(form, info);
  if (deduction === undefined || isUnsupportedResult(deduction)) return deduction;
  return disasterLossOf(form, deduction);
}

/* Part II; undefined when no carryover is on the form, or while a line waits. */
export function partIILinesOf(form: Read, info: Info): PartIILines | Unsupported | undefined {
  const carryovers = carryoverDeductions(form, info);
  if (carryovers === undefined || isUnsupportedResult(carryovers)) return carryovers;
  const deduction = deductionOf(form, info);
  const agi = form[CA_AGI];
  if (deduction === undefined || isUnsupportedResult(deduction)) return deduction;
  if (typeof agi !== "number") return undefined;
  if (carryovers.rows.length === 0) {
    const disaster = disasterLossOf(form, deduction);
    return isUnsupportedResult(disaster) ? disaster : undefined;
  }
  const capitalLossDeduction = capitalLossDeductionOf(form);
  return partII({
    // Line 1, Form 540 filers: "Subtract 2025 Form 540, line 18 from Form 540, line 17" (::b01).
    taxableIncome: agi - deduction,
    // Line 2: Schedule D (540) line 9, the capital loss deduction (::b01).
    capitalLossDeduction,
    // Lines 3 and 4: Schedule CA lines 9b1 and 9b2, column B (::b02).
    disasterCarryoverUsed: carryovers.disasterUsed,
    nolCarryoverUsed: carryovers.nolUsed,
    itemizedAdjustment: itemizedAdjustment(form, info, deduction, capitalLossDeduction),
  });
}

/* Part III line 4 column (d): the current year NOL as a positive amount; 0 when none. */
export function currentNolOf(form: Read, info: Info): Amount | undefined {
  const lines = sectionALinesOf(form, info);
  if (lines === undefined || isUnsupportedResult(lines)) return lines;
  return currentYearNol(lines.line25);
}

/* Part III lines 5 and 6; each the gap of what it adds. */
export function totalsOf(
  form: Read,
  info: Info,
): { line5: Amount; line6: Amount } | Unsupported | undefined {
  const figures = figuresOf(info);
  if (figures === undefined || isUnsupportedResult(figures)) return figures;
  const carryovers = carryoverDeductions(form, info);
  const currentNol = currentNolOf(form, info);
  const disaster = currentDisasterOf(form, info);
  if (carryovers === undefined || currentNol === undefined || disaster === undefined) {
    return undefined;
  }
  if (isUnsupportedResult(carryovers)) return carryovers;
  const totals = carryoverTotals(
    carryovers.rows,
    isUnsupportedResult(currentNol) ? 0 : currentNol,
    0,
  );
  return {
    line5: isUnsupportedResult(currentNol) ? currentNol : totals.line5,
    line6: isUnsupportedResult(disaster) ? disaster : totals.line6,
  };
}
