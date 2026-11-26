/*
 * FTB 3805V arithmetic for a California resident: Part I Section A and Part II,
 * as pure functions of amounts (ca-3805v-inst-2025 and the form; no answer key,
 * QUESTIONS.md). Lines 4 to 24 are "as if they were all positive numbers" (the
 * form). An input is a whole-dollar amount or the reason the engine cannot
 * figure it; a line that reads a gap is that gap.
 */

import { atLeast, sum } from "../../../money.js";
import type { Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";

export type Amount = number | Unsupported;

/*
 * Part III: "The NOL carryover deduction is suspended for the 2024, 2025, and
 * 2026 taxable years, if your net business income is $1,000,000 or more and
 * modified AGI is $1,000,000 or more" (ca-3805v-inst-2025::sec::part-iii-limitations::b02).
 */
export const SUSPENSION_THRESHOLD = 1_000_000;

export function nolSuspended(netBusinessIncome: number, modifiedAgi: number): boolean {
  return netBusinessIncome >= SUSPENSION_THRESHOLD && modifiedAgi >= SUSPENSION_THRESHOLD;
}

/* The first gap among the values, else undefined. */
export function firstGap(values: ReadonlyArray<Amount | undefined>): Unsupported | undefined {
  return values.find(isUnsupportedResult);
}

/* The amount by which `larger` is more than `smaller`; 0 when it is not ("otherwise, enter -0-"). */
const excessOver = (larger: number, smaller: number) => atLeast(0, larger - smaller);
const added = (first: number, second: number) => first + second;

/* `compute` on two amounts, or the first one's gap. */
function both(first: Amount, second: Amount, compute: (a: number, b: number) => number): Amount {
  const gap = firstGap([first, second]);
  return gap ?? compute(first as number, second as number);
}

/* What Section A reads besides Form 540 lines 17 and 18. */
export interface SectionAInputs {
  /* Line 1: Form 540 line 17. */
  agi: number;
  /* Line 2: Form 540 line 18, a positive amount. */
  deduction: number;
  /* Line 3b: the 2025 declared disaster loss in line 3a; 0 when none. */
  disasterLoss: Amount;
  /* Lines 4, 5, 13, 14 (ca-3805v-inst-2025::sec::general-information::b09). */
  nonbusinessCapitalLosses: Amount;
  nonbusinessCapitalGains: Amount;
  businessCapitalLosses: Amount;
  businessCapitalGains: Amount;
  /* Line 8 (ca-3805v-inst-2025::sec::section-a-california-residents::b01). */
  nonbusinessDeductions: Amount;
  /* Line 9 (::section-a-california-residents::b01). */
  nonbusinessIncome: Amount;
  /* Line 18: the loss on Schedule D (540) line 8, positive; 0 when line 8 is not a loss. */
  scheduleDLoss: Amount;
  /* Line 19: Schedule D (540) line 9, the capital loss deduction. */
  capitalLossDeduction: Amount;
  /* Line 23: the NOL and disaster loss carryover deductions taken in 2025 (QUESTIONS.md, DECISION). */
  carryoverDeductions: Amount;
}

export interface SectionALines {
  line1: number;
  line2: number;
  line3a: number;
  line3b?: Amount;
  line3c?: Amount;
  line4?: Amount;
  line5?: Amount;
  line6?: Amount;
  line7?: Amount;
  line8?: Amount;
  line9?: Amount;
  line10?: Amount;
  line11?: Amount;
  line12?: Amount;
  line13?: Amount;
  line14?: Amount;
  line15?: Amount;
  line16?: Amount;
  line17?: Amount;
  line18?: Amount;
  line19?: Amount;
  line20?: Amount;
  line21?: Amount;
  line22?: Amount;
  line23?: Amount;
  line24?: Amount;
  /* The current year NOL: 0 or a negative amount (printed in brackets). */
  line25: Amount;
}

/* Lines 4 to 17: the nonbusiness and business capital and deduction limits. */
function capitalAndNonbusinessLines(input: SectionAInputs) {
  const line4 = input.nonbusinessCapitalLosses;
  const line5 = input.nonbusinessCapitalGains;
  const line6 = both(line4, line5, excessOver);
  const line7 = both(line5, line4, excessOver);
  const line8 = input.nonbusinessDeductions;
  const line9 = input.nonbusinessIncome;
  const line10 = both(line7, line9, added);
  // Lines 11 and 12 (::section-a-california-residents::b01): nonbusiness deductions only against nonbusiness income.
  const line11 = both(line8, line10, excessOver);
  const line12 = both(line10, line8, excessOver);
  const line13 = input.businessCapitalLosses;
  const line14 = input.businessCapitalGains;
  const line15 = both(line12, line14, added);
  // Line 16 (::section-a-california-residents::b02): business capital losses up to line 15.
  const line16 = both(line13, line15, excessOver);
  const line17 = both(line6, line16, added);
  return {
    line4,
    line5,
    line6,
    line7,
    line8,
    line9,
    line10,
    line11,
    line12,
    line13,
    line14,
    line15,
    line16,
    line17,
  };
}

/*
 * Lines 18 to 22: "If you do not have a loss on that line [Schedule D (540)
 * line 8], skip line 18 through line 21 and enter on line 22 the amount from
 * line 17" (the form).
 */
function scheduleDLines(input: SectionAInputs, line17: Amount) {
  const loss = input.scheduleDLoss;
  if (loss === 0) return { line22: line17 };
  const line18 = loss;
  const line19 = input.capitalLossDeduction;
  const line20 = both(line18, line19, excessOver);
  const line21 = both(line19, line18, excessOver);
  const line22 = both(line17, line20, excessOver);
  return { line18, line19, line20, line21, line22 };
}

/* Lines 4 to 25, when line 3c is negative. */
function lossLines(
  line3c: number,
  input: SectionAInputs,
): Omit<SectionALines, "line1" | "line2" | "line3a"> {
  const capital = capitalAndNonbusinessLines(input);
  const scheduleD = scheduleDLines(input, capital.line17);
  const line23 = input.carryoverDeductions;
  // Line 24: "Add lines 11, 21, 22, and 23"; line 21 is blank when lines 18 to 21 are skipped.
  const parts = [capital.line11, scheduleD.line21 ?? 0, scheduleD.line22, line23];
  const gap = firstGap(parts);
  const line24: Amount = gap ?? sum(...parts);
  // Line 25: "Combine line 3c and line 24. If more than zero, enter -0-."
  const line25 = both(line3c, line24, (loss, adjustments) => Math.min(0, loss + adjustments));
  return { line3c, ...capital, ...scheduleD, line23, line24, line25 };
}

/*
 * Section A (ca-3805v-inst-2025::sec::section-a-california-residents::b01,
 * the form). Line 3a positive: "enter -0- here and on line 25. Do not complete
 * the rest of Section A". Line 3c zero or more: "do not complete the rest of
 * Part I"; line 25 is then 0 too (QUESTIONS.md).
 */
export function sectionA(input: SectionAInputs): SectionALines {
  const { agi: line1, deduction: line2 } = input;
  const combined = line1 - line2;
  if (combined >= 0) return { line1, line2, line3a: 0, line25: 0 };
  const line3b = input.disasterLoss;
  if (isUnsupportedResult(line3b)) {
    return { line1, line2, line3a: combined, line3b, line3c: line3b, line25: line3b };
  }
  const line3c = combined + line3b;
  const base = { line1, line2, line3a: combined, line3b: line3b === 0 ? undefined : line3b };
  if (line3c >= 0) return { ...base, line3c, line25: 0 };
  return { ...base, ...lossLines(line3c, input) };
}

/* The current year NOL as a positive amount (Part III line 4 column (d)); 0 when none. */
export function currentYearNol(line25: Amount): Amount {
  return isUnsupportedResult(line25) ? line25 : -line25;
}

/* What Part II reads. */
export interface PartIIInputs {
  /* Line 1: Form 540 line 17 less line 18; negative allowed. */
  taxableIncome: number;
  capitalLossDeduction: number;
  disasterCarryoverUsed: number;
  nolCarryoverUsed: number;
  itemizedAdjustment: Amount;
}

export interface PartIILines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: Amount;
  line6: Amount;
}

/*
 * Part II (ca-3805v-inst-2025::sec::part-ii-modified-taxable-income-mti::b01,
 * ::b02): taxable income plus the capital loss, disaster loss carryover and
 * NOL carryover deductions and the itemized deduction adjustment. Line 6: "If
 * line 6 is zero or less, enter -0-".
 */
export function partII(input: PartIIInputs): PartIILines {
  const line5 = input.itemizedAdjustment;
  const parts = [
    input.taxableIncome,
    input.capitalLossDeduction,
    input.disasterCarryoverUsed,
    input.nolCarryoverUsed,
  ];
  const line6 = isUnsupportedResult(line5) ? line5 : atLeast(0, sum(...parts, line5));
  return {
    line1: input.taxableIncome,
    line2: input.capitalLossDeduction,
    line3: input.disasterCarryoverUsed,
    line4: input.nolCarryoverUsed,
    line5,
    line6,
  };
}

/*
 * Part II line 6 figured before the carryover deductions: California AGI before
 * Schedule CA lines 9b1 and 9b2, less Form 540 line 18, plus the capital loss
 * deduction and the itemized adjustment. Lines 3 and 4 add back what line 1
 * subtracted, so this equals line 6 and does not depend on the deductions it limits.
 */
export function modifiedTaxableIncome(input: {
  agiBeforeCarryovers: number;
  deduction: number;
  capitalLossDeduction: number;
  itemizedAdjustment: number;
}): number {
  return atLeast(
    0,
    input.agiBeforeCarryovers -
      input.deduction +
      input.capitalLossDeduction +
      input.itemizedAdjustment,
  );
}
