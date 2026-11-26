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
 * Form 461's own lines answer the first (federal/461/); its resolver asks the
 * second. The loss limits (limits.ts) no longer ask either: the limit does not
 * change Schedule E.
 */

import type { FilingStatus } from "../../values.js";

/*
 * The return's business losses outside the K-1s, positive, added without any
 * income (receipts.ts, otherBusinessLosses), by the Form 461 line they reach:
 * Schedule 1 line 3 (Schedule C) is line 2, Schedule 1 line 5 (Schedule E)
 * is line 5, and Schedule 1 line 6 (Schedule F) is line 6
 * (irs-461-inst-2025::sec::line-2::b01, ::line-5::b01, ::line-6::b01).
 * unknownKeys lists the facts whose amount is not known yet.
 */
export interface OtherBusinessLosses {
  scheduleCLosses: number;
  rentalLosses: number;
  /* Absent where a caller builds the losses itself: no farm. */
  farmLosses?: number;
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
  k1Losses + other.scheduleCLosses + other.rentalLosses + (other.farmLosses ?? 0);

/*
 * Question 2: who must attach Form 461. Losses without income bound each
 * line's loss and the net loss, so the answer can be yes when the lines net
 * below the limits (QUESTIONS.md in federal/461/): the form then files with
 * line 16 at 0 or more, and nothing reaches Schedule 1 line 8p. The K-1
 * business losses and the rentals' reach line 5 (Schedule E), the Schedule C
 * losses line 2, the farm losses line 6, a stated other business loss
 * (positive here) line 8.
 */
export function form461Required(
  k1Losses: number,
  other: OtherBusinessLosses,
  otherBusinessLoss: number,
  status: FilingStatus | undefined,
): boolean {
  const lineLosses = [
    k1Losses + other.rentalLosses,
    other.scheduleCLosses,
    other.farmLosses ?? 0,
    otherBusinessLoss,
  ];
  const total = totalBusinessLosses(k1Losses, other) + otherBusinessLoss;
  return (
    lineLosses.some((loss) => loss > FORM_461_LINE_LOSS_LIMIT) ||
    total > excessBusinessLossThreshold(status)
  );
}
