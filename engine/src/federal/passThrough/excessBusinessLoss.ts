/*
 * The two questions Form 461's Who Must File answers
 * (irs-461-inst-2025::sec::who-must-file::b01, ::b02), asked of the return's
 * business losses added without any income:
 * 1. Can any loss be limited? An excess business loss is "the amount by which
 *    the total deductions ... from your trades or businesses are more than
 *    your total gross income or gains from your trades or businesses, plus the
 *    threshold amount" (::b02). Losses added without income bound that
 *    amount, so at or below the threshold nothing can be limited.
 * 2. Must Form 461 be attached? Yes when "your net losses from all of your
 *    trades or businesses are more than $313,000 ($626,000 for taxpayers
 *    filing a joint return), or ... you would report a loss of more than
 *    $156,500 on any one of Form 461, lines 1 through 8" (::b01).
 * The loss limits (limits.ts) ask the first; Form 461's resolver the second.
 */

import type { FilingStatus } from "../../values.js";

/*
 * The return's business losses outside the K-1s, positive, added without any
 * income (receipts.ts, otherBusinessLosses), by the Form 461 line they reach:
 * Schedule 1 line 3 (Schedule C) is line 2, and Schedule 1 line 5 (Schedule E)
 * is line 5 (irs-461-inst-2025::sec::line-2::b01, ::line-5::b01). unknownKeys
 * lists the facts whose amount is not known yet.
 */
export interface OtherBusinessLosses {
  scheduleCLosses: number;
  rentalLosses: number;
  unknownKeys: string[];
}

/* 2025: $313,000, or $626,000 on a joint return (irs-461-inst-2025::sec::who-must-file::b02). */
const THRESHOLD = 313_000;
const JOINT_THRESHOLD = 626_000;

/* The most one Form 461 line may show as a loss before the form must be attached (::b01). */
export const FORM_461_LINE_LOSS_LIMIT = 156_500;

/*
 * The threshold for the filing status. An unknown status uses the lower one:
 * the other stages never wait on the status, and the lower threshold can only
 * stop a loss, never let one through that a joint return would limit.
 */
export function excessBusinessLossThreshold(status: FilingStatus | undefined): number {
  return status === "married_filing_jointly" ? JOINT_THRESHOLD : THRESHOLD;
}

/* Every business loss of the return added up: the K-1s' and the other ones. */
export const totalBusinessLosses = (k1Losses: number, other: OtherBusinessLosses) =>
  k1Losses + other.scheduleCLosses + other.rentalLosses;

/* Question 1: no loss can be limited when the losses are at most the threshold. */
export function noLossCanBeLimited(
  k1Losses: number,
  other: OtherBusinessLosses,
  status: FilingStatus | undefined,
): boolean {
  return totalBusinessLosses(k1Losses, other) <= excessBusinessLossThreshold(status);
}

/*
 * Question 2: a line's losses above $156,500. The K-1 business losses and the
 * rentals' reach line 5 (Schedule E), the Schedule C losses line 2. Losses
 * without income bound each line's loss, so the answer can be yes when the
 * line nets below $156,500 (QUESTIONS.md). Losses above $313,000 always put
 * more than $156,500 on one of the two lines, so the net loss test needs no
 * check of its own here.
 */
export function form461Required(k1Losses: number, other: OtherBusinessLosses): boolean {
  return (
    k1Losses + other.rentalLosses > FORM_461_LINE_LOSS_LIMIT ||
    other.scheduleCLosses > FORM_461_LINE_LOSS_LIMIT
  );
}
