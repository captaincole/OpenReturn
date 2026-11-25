/*
 * Form 461 (2025) arithmetic, pure: whole-dollar amounts in, lines out. The
 * bindings read the amounts from Schedule 1, Form 1040 and Schedule E
 * (figures.ts); the threshold comes from excessBusinessLoss.ts.
 */

import { atLeast, sum } from "../../money.js";

/* What Part I copies from the return; undefined is a blank line. */
export interface PartIAmounts {
  /* Line 2: Schedule 1 line 3 (irs-461-inst-2025::sec::line-2::b01). */
  line2?: number;
  /* Line 3: Form 1040 line 7a (::line-3::b01). */
  line3?: number;
  /* Line 4: Schedule 1 line 4 (::line-4::b01). */
  line4?: number;
  /* Line 5: Schedule 1 line 5 (::line-5::b01). */
  line5?: number;
  /* Line 6: Schedule 1 line 6 (::line-6::b01). */
  line6?: number;
  /* Line 8: other business income, gain or loss (::line-8::b01). */
  line8?: number;
}

/* Lines 1 and 7 are "Reserved for future use": "Leave line 1 blank" (::line-1::b01, ::line-7::b01). */
export function line9(amounts: PartIAmounts): number {
  // "Combine all the entries from lines 1 through 8 ... can be a positive or negative number" (::line-9::b01).
  return sum(
    amounts.line2,
    amounts.line3,
    amounts.line4,
    amounts.line5,
    amounts.line6,
    amounts.line8,
  );
}

/* The part of line 3 that Part II takes out, a positive amount on line 10 or line 11. */
export interface CapitalAdjustment {
  nonbusinessGain: number;
  capitalLoss: number;
}

/*
 * Line 3's capital gain or loss in Part II (irs-461-inst-2025::sec::line-3::b01,
 * ::who-must-file::b02). "Losses from sales or exchanges of capital assets are
 * not included": a loss on line 3 goes back on line 11. A gain counts only up
 * to "the lesser of capital gain net income limited to only gains and losses
 * attributable to a trade or business, or capital gain net income"; the rest
 * goes on line 10. Capital gain net income is the excess of gains over losses,
 * never below 0: the gain on line 3 (Form 1040 line 7a). businessNet is the
 * taxpayer's net gain or loss from business capital assets (0 when none).
 *
 * DECISION (2026-11-24): a business's capital loss does not count as a business loss.
 * - Pub. 225, the farmer's tax guide: "Business gains and losses reported on
 *   Form 4797 and Form 8949 are included in the excess business loss
 *   calculation" (irs-pub-225-2025::sec::excess-business-loss::b01).
 * - Form 461 instructions: "Losses from sales or exchanges of capital assets
 *   are not included in the calculation of the total deductions from your
 *   trades or businesses" (irs-461-inst-2025::sec::line-3::b01).
 * The engine follows the Form 461 instructions. A guide written for farmers
 * governs a farm's forms; on every other form its own instructions decide.
 *
 * DECISION (2026-11-24): a business gain next to an investment loss takes the cap.
 * Two sentences of irs-461-inst-2025::sec::line-3::b01 differ: "any such
 * amounts included here in line 3 should be added back on line 11", and gains
 * "should not exceed the lesser of capital gain net income limited to only
 * gains and losses attributable to a trade or business, or capital gain net
 * income". With a $60,000 business gain and a $20,000 investment loss, line 3
 * is $40,000: the engine counts $40,000. Adding the loss back would count
 * $60,000, above the cap.
 */
export function capitalAdjustment(
  line3: number | undefined,
  businessNet: number,
): CapitalAdjustment {
  const reported = line3 ?? 0;
  if (reported <= 0) return { nonbusinessGain: 0, capitalLoss: 0 - reported };
  const kept = Math.min(atLeast(0, businessNet), reported);
  return { nonbusinessGain: reported - kept, capitalLoss: 0 };
}

export interface PartIIIAmounts {
  line12: number;
  line13: number;
  line14: number;
  line15: number;
  line16: number;
}

/*
 * Lines 12 to 16. Line 12 = line 10 - line 11 (::line-12::b01); line 13 is
 * line 12 with its sign reversed (the form's line 13); line 14 = line 9 +
 * line 13 (::line-14::b01); line 15 is the threshold; line 16 = line 14 +
 * line 15, and a negative line 16 is the excess business loss (::line-16::b01).
 */
export function partIII(
  line9Amount: number,
  line10: number,
  line11: number,
  threshold: number,
): PartIIIAmounts {
  const line12 = line10 - line11;
  const line13 = 0 - line12;
  const line14 = line9Amount + line13;
  return { line12, line13, line14, line15: threshold, line16: line14 + threshold };
}

/*
 * Schedule 1 line 8p: "If less than zero, enter the amount from line 16 as a
 * positive number" (the form's line 16; irs-1040-inst-2025::sec::line-8p::b01).
 * Undefined when line 16 is 0 or more: there is no excess business loss.
 */
export function excessBusinessLossAdjustment(line16: number): number | undefined {
  return line16 < 0 ? 0 - line16 : undefined;
}
