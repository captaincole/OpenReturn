/*
 * Schedule SE's net-earnings rule, shared by the form's lines and the resolvers
 * that need it before the form is evaluated (Schedule SE and Form 8959 must-file).
 */

import { roundDollars } from "../../money.js";

/* Line 4a: 92.35% of line 3. */
export const NET_EARNINGS_RATE = 0.9235;

/* Line 4c: under $400 there is no self-employment tax (irs-1040sse-inst-2025::sec::who-must-file-schedule-se::b01). */
export const MIN_NET_EARNINGS = 400;

/*
 * Lines 4a through 4c: "If both lines 4a and 4c are less than $400 and you have
 * an amount on line 1b, combine lines 1a and 2. If the total of lines 1a and 2
 * is $434 or more, file Schedule SE (completed through line 4c)"
 * (irs-1040sse-inst-2025::sec::line-1b::b01).
 */
export const CRP_FILING_THRESHOLD = 434;

/* Line 4a: line 3 times 92.35% when line 3 is more than zero; otherwise line 3. */
export function netEarnings(line3: number): number {
  return line3 > 0 ? roundDollars(line3 * NET_EARNINGS_RATE) : line3;
}
