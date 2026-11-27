/*
 * Schedule J (Form 1040) arithmetic: pure functions on whole dollars, one per
 * rule, with the block id of irs-1040sj-inst-2025 (or the form face,
 * irs-1040sj-face-2025) that states it. The tax on an amount is figured
 * elsewhere (tax.ts, baseYearTax.ts); these functions combine the results.
 */

import type { BelowZeroTaxableIncome } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import type { Unsupported } from "../../types.js";

/* Line 6: "Divide the amount on line 2a by 3.0" (the face). */
const BASE_YEAR_COUNT = 3;

/* A line the engine figures, or why it cannot. */
export type Line = number | Unsupported;

export const isGap = (line: Line | undefined): line is Unsupported => typeof line === "object";

/*
 * Line 2a: the elected farm income. "Do not enter more than the amount on
 * line 1" (the face); "Your elected farm income can't exceed your taxable
 * income" (specific-instructions::b04). Never below 0: a farm loss is not
 * averaged.
 */
export function line2a(electedFarmIncome: number, line1: number): number {
  return atLeast(0, Math.min(roundDollars(electedFarmIncome), line1));
}

/*
 * Line 2b: the part of line 2a treated as net capital gain. It "can't exceed
 * the smaller of your total net capital gain or the net capital gain
 * attributable to your farming or fishing business" (line-2b::b01), and it is
 * part of line 2a. Blank when the election names no capital gain
 * (lines-2b-and-2c::b01: "Complete lines 2b and 2c if ... line 2a includes net
 * capital gain").
 */
export function line2b(
  stated: number | undefined,
  line2aAmount: number,
  totalNetCapitalGain: number,
): number | undefined {
  if (stated === undefined || stated <= 0) return undefined;
  return atLeast(0, Math.min(roundDollars(stated), line2aAmount, totalNetCapitalGain));
}

/*
 * Line 2c: "the smaller of line 2b or the unrecaptured section 1250 gain
 * attributable to your farming or fishing business, if any" (line-2c::b01).
 */
export function line2c(line2bAmount: number | undefined, stated: number | undefined) {
  if (line2bAmount === undefined || stated === undefined || stated <= 0) return undefined;
  return Math.min(line2bAmount, roundDollars(stated));
}

/* Line 3: "Subtract line 2a from line 1" (the face). */
export const line3 = (line1: number, line2aAmount: number) => line1 - line2aAmount;

/* Line 6: line 2a divided by 3.0, to the nearest dollar (a calculated line). */
export const line6 = (line2aAmount: number) => roundDollars(line2aAmount / BASE_YEAR_COUNT);

/*
 * The share of line 2b (or 2c) each base year takes: "you must allocate 1/3 of
 * the amount on Schedule J, line 2b, (and 1/3 of the amount on line 2c, if any)"
 * (line-8::b01, line-12::b01, line-16::b01). Whole dollars, as line 6.
 */
export const baseYearShare = (amount: number | undefined) =>
  amount === undefined ? 0 : roundDollars(amount / BASE_YEAR_COUNT);

/* Line 7: "Combine lines 5 and 6. If zero or less, enter -0-" (the face). */
export const line7 = (line5: number, line6Amount: number) => atLeast(0, line5 + line6Amount);

/*
 * Lines 11 and 15: "Combine lines 9 and 10 [13 and 14]. If less than zero,
 * enter as a negative amount" (the face).
 *
 * DECISION (2026-11-26, by the author): the face says "Combine lines 9 and
 * 10" (irs-1040sj-face-2025, line 11). The instructions' example enters "a
 * negative $12,400 on Schedule J, line 9 ... $6,000 on Schedule J, line 10,
 * and a negative $6,200 on Schedule J, line 11"
 * (irs-1040sj-inst-2025::sec::line-3-2::b02), and −12,400 + 6,000 is −6,400.
 * The engine follows the form's arithmetic: the form's arithmetic wins over a
 * sentence that breaks it (docs/rule-decisions.md).
 */
export const combinedWithShare = (baseIncome: number, share: number) => baseIncome + share;

/*
 * Lines 8, 12 and 16 before the tax: "If line 7 is zero, enter -0- on line 8"
 * (line-8::b01); "If line 11 [15] is zero or less, enter -0-" (line-12::b01,
 * line-16::b01). True when the line is 0 with no tax figured.
 */
export const noTaxOn = (combined: number) => combined <= 0;

/* A total of lines: the first gap among them, else their sum. */
export function totalOf(...lines: Line[]): Line {
  const gap = lines.find(isGap);
  return gap ?? sum(...(lines as number[]));
}

/* Line 17: "Add lines 4, 8, 12, and 16"; line 18 copies it (the face). */
export const line17 = (line4: Line, line8: Line, line12: Line, line16: Line) =>
  totalOf(line4, line8, line12, line16);

/* Line 22: "Add lines 19 through 21" (the face). */
export const line22 = (line19: number, line20: number, line21: number) =>
  sum(line19, line20, line21);

/*
 * Line 23: "Tax. Subtract line 22 from line 18" (the face). No floor: the
 * form gives none (QUESTIONS.md question 6).
 */
export function line23(line18: Line, line22Amount: number): Line {
  return isGap(line18) ? line18 : line18 - line22Amount;
}

/*
 * The Taxable Income Worksheet of a base year whose taxable income was zero
 * or less (2022-taxable-income-worksheet-line-5::b01–b02, and the 2023 and 2024
 * worksheets). The result goes on line 5, 9 or 13 as a negative amount.
 */
export interface TaxableIncomeWorksheet {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  /* The amount for Schedule J: line 5 as a negative amount (0 when line 5 is 0). */
  baseIncome: number;
}

/*
 * Line 2: "If there is a loss on your ... Schedule D, line 21, add that loss
 * (as a positive amount) and your ... capital loss carryover to [the next
 * year]. Subtract from that sum the amount of the loss on your ... Schedule D,
 * line 16". Not below 0 (QUESTIONS.md question 4).
 */
function capitalLossNotAllowed(answers: BelowZeroTaxableIncome): number {
  const line21Loss = roundDollars(answers.scheduleDLine21Loss ?? 0);
  if (line21Loss <= 0) return 0;
  const carryover = roundDollars(answers.capitalLossCarryover ?? 0);
  return atLeast(0, line21Loss + carryover - roundDollars(answers.scheduleDLine16Loss ?? 0));
}

/*
 * Line 1 the amount below zero; line 3 the NOL; line 4 = 2 + 3; line 5 = 1 − 4.
 * Line 5 is at least 0: a negative income averaging base is the part of the
 * year's loss that gives no benefit in another year (QUESTIONS.md question 4).
 */
export function taxableIncomeWorksheet(answers: BelowZeroTaxableIncome): TaxableIncomeWorksheet {
  const line1 = roundDollars(answers.belowZero);
  const line2 = capitalLossNotAllowed(answers);
  const line3 = roundDollars(answers.netOperatingLoss ?? 0);
  const line4 = line2 + line3;
  const line5 = atLeast(0, line1 - line4);
  return { line1, line2, line3, line4, line5, baseIncome: line5 === 0 ? 0 : -line5 };
}
