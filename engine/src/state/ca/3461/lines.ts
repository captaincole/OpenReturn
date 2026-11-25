/*
 * FTB 3461 (2025) arithmetic, pure: whole-dollar amounts in, lines out. The
 * bindings read Part I from Schedule CA (540) (figures.ts). California figures
 * its excess business loss as federal Form 461 does, with two changes: a
 * business capital loss stays a business loss (line 11), and a loss held back
 * in an earlier year comes back as a carryover on line 14b, not as an NOL
 * (ca-3461-inst-2025::sec::a-purpose::b01).
 */

import { atLeast, sum } from "../../../money.js";

/* Line 15: "$313,000 ($626,000 for married/RDP taxpayers filing a joint return)" (ca-3461-inst-2025::sec::c-definitions::b01). */
export const CA_EXCESS_BUSINESS_LOSS_THRESHOLD = 313_000;
export const CA_EXCESS_BUSINESS_LOSS_JOINT_THRESHOLD = 626_000;

/* The line 15 amount for the filing status (the joint amount only for a joint return). */
export function caThreshold(jointReturn: boolean): number {
  return jointReturn ? CA_EXCESS_BUSINESS_LOSS_JOINT_THRESHOLD : CA_EXCESS_BUSINESS_LOSS_THRESHOLD;
}

/* Part I as the bindings read it; undefined is a blank line. */
export interface CaPartIAmounts {
  /* Line 2: Schedule CA line 3, A − B + C (ca-3461-inst-2025::sec::part-i::b01). */
  line2?: number;
  /* Line 3: Schedule CA line 7a, A − B + C. */
  line3?: number;
  /* Line 4: Schedule CA line 4, A − B + C. */
  line4?: number;
  /* Line 5: Schedule CA line 5, A − B + C. */
  line5?: number;
  /* Line 6: Schedule CA line 6, A − B + C. */
  line6?: number;
  /* Line 8: other trade or business income, gain or loss (::line-8::b01). */
  line8?: number;
}

/* Line 9: "Combine all the entries from line 1 through line 8" (::line-9::b01); lines 1 and 7 are reserved. */
export function line9(amounts: CaPartIAmounts): number {
  return sum(
    amounts.line2,
    amounts.line3,
    amounts.line4,
    amounts.line5,
    amounts.line6,
    amounts.line8,
  );
}

/* Line 3's part that is not from a trade or business, as positive amounts for line 10 or 11. */
export interface CaCapitalSplit {
  nonbusinessGain: number;
  nonbusinessLoss: number;
}

/*
 * Line 3 split into a business part and the rest.
 * - A loss: "If the loss from your trade or business is less than ($3,000),
 *   enter the difference between ($3,000) and your trade or business loss. Do
 *   not enter any loss amount on this line ... if the loss from your trade or
 *   business is equal to or greater than ($3,000)" (::line-11::b01). Read for
 *   any loss on line 3, limited or not: the business part has the sign of
 *   line 3 and is never larger than it.
 * - A gain (or 0): line 10 takes the "income or gain ... not from a trade or
 *   business" and line 11 the losses (::line-10::b01, ::line-11::b01). The
 *   business part is the whole business net, gain or loss. Federal Form 461
 *   caps a business gain at capital gain net income
 *   (irs-461-inst-2025::sec::line-3::b01), a CARES Act rule; "California does
 *   not conform to those amendments"
 *   (ca-3461-inst-2025::sec::excess-business-loss-limitation::b01).
 * businessNet is the stated net gain or loss from business capital assets.
 */
export function capitalSplit(line3: number | undefined, businessNet: number): CaCapitalSplit {
  if (line3 === undefined) return { nonbusinessGain: 0, nonbusinessLoss: 0 };
  const businessPart = line3 < 0 ? Math.max(line3, Math.min(0, businessNet)) : businessNet;
  const rest = line3 - businessPart;
  return { nonbusinessGain: atLeast(0, rest), nonbusinessLoss: atLeast(0, 0 - rest) };
}

export interface CaPartIIIAmounts {
  line12: number;
  line13: number;
  line14a: number;
  /* Negative; undefined with no carryover. */
  line14b?: number;
  line14c: number;
  line15: number;
  line16: number;
}

/*
 * Lines 12 to 16. Line 12 = line 10 − line 11 (::line-12::b01); line 13 is
 * line 12 with its sign reversed (the form); line 14a = line 9 + line 13
 * (::line-14a::b01); line 14b is last year's carryover "as a negative number"
 * (::line-14b::b01); line 14c = 14a + 14b (::line-14c::b01); line 16 = 14c +
 * line 15 (::line-16::b01). carryover is positive; 0 means none.
 */
export function partIII(
  line9Amount: number,
  line10: number,
  line11: number,
  carryover: number,
  threshold: number,
): CaPartIIIAmounts {
  const line12 = line10 - line11;
  const line13 = 0 - line12;
  const line14a = line9Amount + line13;
  const line14b = carryover > 0 ? 0 - carryover : undefined;
  const line14c = sum(line14a, line14b);
  return {
    line12,
    line13,
    line14a,
    line14b,
    line14c,
    line15: threshold,
    line16: line14c + threshold,
  };
}

/*
 * Line 17, with a carryover on line 14b: line 16 as a positive number less
 * "the excess business loss adjustment amount included as income in prior
 * years", when line 16 is more; otherwise "You do not have an excess business
 * loss adjustment for 2025" (::line-17::b01). Undefined: blank.
 */
export function line17(
  line16: number,
  carryover: number,
  priorAdjustments: number,
): number | undefined {
  if (carryover <= 0 || line16 >= 0) return undefined;
  const excess = 0 - line16;
  return excess > priorAdjustments ? excess - priorAdjustments : undefined;
}

/*
 * Schedule CA line 8p column C: "the amount from form FTB 3461, line 16 or
 * line 17, whichever applies" (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b04).
 * With no carryover, line 16 below 0 as a positive number (::line-16::b01);
 * with one, line 17 (::line-16::b02). Undefined: no adjustment.
 */
export function line8pAdjustment(
  line16: number,
  carryover: number,
  priorAdjustments: number,
): number | undefined {
  if (carryover > 0) return line17(line16, carryover, priorAdjustments);
  return line16 < 0 ? 0 - line16 : undefined;
}

/*
 * Schedule CA line 8z column B: the part of the carryover used this year
 * (ca-540-sched-ca-inst-2025::sec::line-8-other-income::b13). With a business
 * loss on line 14a, "subtract line 14a (positive number) from line 15", no
 * more than line 14b (ca-3461-inst-2025::sec::line-15::b01); with business
 * income, the carryover "up to the business income amount" (::line-14b::b01)
 * plus, by the same line 15 rule, the threshold, so that what is used and
 * what line 16 carries forward add up to line 14b (QUESTIONS.md item 4).
 * The two cases are one formula: line 14a + line 15, from 0 to the carryover.
 */
export function carryoverUsed(line14a: number, carryover: number, threshold: number): number {
  if (carryover <= 0) return 0;
  return Math.min(carryover, atLeast(0, line14a + threshold));
}
