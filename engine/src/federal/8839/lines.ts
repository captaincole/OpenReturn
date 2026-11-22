import type { AdoptionChildFactValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * 2025 amounts. The maximum credit and the exclusion are both $17,280 per
 * child; the phase-out starts above $259,190 and ends at $299,190
 * (irs-8839-inst-2025::sec::what-s-new::b01, general-instructions::b04).
 */
export const TAX_YEAR = 2025;
export const MAXIMUM_CREDIT_PER_CHILD = 17_280; // part-ii-adoption-credit::b01
export const MAXIMUM_EXCLUSION_PER_CHILD = 17_280; // part-iii-employer-provided::b01
export const PHASEOUT_START = 259_190; // lines 8 and 26 of the blank form
export const PHASEOUT_RANGE = 40_000; // lines 9 and 27 of the blank form
/* Line 11b: up to $5,000 per child is refundable (what-s-new::b01, line-13::b01). */
export const REFUNDABLE_PART_PER_CHILD = 5_000;
/* Lines 9 and 27: "rounded to at least three places"; the engine uses three. */
export const RATIO_PLACES = 1_000;
/* Line 1 prints three children; more go on another Form 8839 (more-than-three-eligible-children::b01). */
export const LINE_1_ROW_COUNT = 3;

/* Where the adoption stands at the end of 2025. */
export type Finality = "not_final" | "final_this_year" | "final_before";

export function finalityOf(child: AdoptionChildFactValue): Finality {
  const year = child.finalYear;
  if (year === undefined || year > TAX_YEAR) return "not_final";
  return year === TAX_YEAR ? "final_this_year" : "final_before";
}

/* A U.S. child with special needs whose adoption became final in 2025 (line-5::b01, line-24::b01). */
export function specialNeedsFinalThisYear(child: AdoptionChildFactValue): boolean {
  return (
    child.specialNeeds === true && child.foreign !== true && finalityOf(child) === "final_this_year"
  );
}

/*
 * Line 5 (irs-8839-inst-2025::sec::line-5::b01, b02): expenses paid in 2024 when
 * the adoption is not final at the end of 2025 (an unsuccessful attempt too),
 * in 2024 and 2025 when it became final in 2025, in 2025 when it became final
 * before. A foreign child final in 2025 uses every year
 * (more-than-three-eligible-children::b09). A special needs child final in 2025:
 * $17,280 minus line 3, whatever was paid. Cents add, the total rounds.
 */
export function line5Expenses(child: AdoptionChildFactValue, line3: number): number {
  if (specialNeedsFinalThisYear(child)) return atLeast(0, MAXIMUM_CREDIT_PER_CHILD - line3);
  const finality = finalityOf(child);
  if (finality === "not_final") return roundDollars(sum(child.expensesPaid2024));
  if (finality === "final_before") return roundDollars(sum(child.expensesPaid2025));
  const earlier = child.foreign === true ? child.expensesPaidBefore2024 : 0;
  return roundDollars(sum(earlier, child.expensesPaid2024, child.expensesPaid2025));
}

/* Lines 8 and 9 (or 26 and 27). Over: line 8 and the ratio, at most 1.000, in thousandths. */
export interface PhaseOut {
  over: boolean;
  excess?: number;
  thousandths: number;
}

export function phaseOut(magi: number): PhaseOut {
  if (magi <= PHASEOUT_START) return { over: false, thousandths: 0 };
  const excess = magi - PHASEOUT_START;
  const thousandths = roundDollars((excess / PHASEOUT_RANGE) * RATIO_PLACES);
  return { over: true, excess, thousandths: Math.min(RATIO_PLACES, thousandths) };
}

/* Lines 10 and 28: an amount times the ratio, nearest dollar. */
export function reductionOf(amount: number, thousandths: number): number {
  return roundDollars((amount * thousandths) / RATIO_PLACES);
}

/* Line 9 or 27 as the form prints it: the digit before the point and three after. */
export function ratioText(thousandths: number): { whole: string; fraction: string } {
  const fraction = thousandths % RATIO_PLACES;
  return {
    whole: String((thousandths - fraction) / RATIO_PLACES),
    fraction: String(fraction).padStart(3, "0"),
  };
}

/* One child's Part II column, lines 2 through 11b. */
export interface PartIIColumn {
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line10: number;
  line11a: number;
  line11b: number;
}

export interface PartIIResult {
  columns: PartIIColumn[];
  line7: number;
  phaseOut: PhaseOut;
  line11c: number;
  line12: number;
  line13: number;
  line14: number;
  line15: number;
  line16: number;
}

/* Lines 2 through 5 for one child: the inputs of the column. */
export interface PartIIInput {
  line2: number;
  line3: number;
  line5: number;
}

/*
 * Lines 2–16 (the blank form). Line 4 is not less than zero (a share of the
 * limit below an earlier year's credit). Line 13 is line 11c
 * (irs-8839-inst-2025::sec::line-13::b01); line 14 is not less than zero.
 */
export function partII(inputs: PartIIInput[], magi: number, carryforward: number): PartIIResult {
  const phase = phaseOut(magi);
  const columns = inputs.map((input): PartIIColumn => {
    const line4 = atLeast(0, input.line2 - input.line3);
    const line6 = Math.min(line4, input.line5);
    const line10 = phase.over ? reductionOf(line6, phase.thousandths) : 0;
    const line11a = line6 - line10;
    return {
      ...input,
      line4,
      line6,
      line10,
      line11a,
      line11b: Math.min(line11a, REFUNDABLE_PART_PER_CHILD),
    };
  });
  const line11c = sum(...columns.map((column) => column.line11b));
  const line12 = sum(...columns.map((column) => column.line11a));
  const line13 = line11c;
  const line14 = atLeast(0, line12 - line13);
  return {
    columns,
    line7: magi,
    phaseOut: phase,
    line11c,
    line12,
    line13,
    line14,
    line15: carryforward,
    line16: line14 + carryforward,
  };
}

/*
 * Credit Limit Worksheet, line 17 (irs-8839-inst-2025::sec::credit-limit-worksheet-line-17::b01):
 * the smaller of line 16 and Form 1040 line 18 less the credits taken before
 * this one (1040 line 19; Schedule 3 lines 1–4, 5b, 6d, 6f, 6g, 6l, 6m). Not
 * less than zero.
 */
export function creditLimit(line16: number, form1040Line18: number, creditsBefore: number): number {
  return atLeast(0, Math.min(line16, form1040Line18 - creditsBefore));
}

/* Line 18: the smaller of lines 16 and 17. The rest carries forward (line-18-nonrefundable-adoption::b01). */
export function nonrefundableCredit(line16: number, line17: number): number {
  return Math.min(line16, line17);
}
