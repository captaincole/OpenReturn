/*
 * FTB 3913: a move for work that is not a military move. California did not
 * suspend the moving expense deduction: "California law does not conform to
 * federal law regarding the suspension of the deduction for moving expenses,
 * except for members of the Armed Forces on active duty"
 * (ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b01). One fact per
 * move: "If you qualify to deduct expenses for more than one move, use a
 * separate form FTB 3913 for each move" (ca-3913-inst-2025::sec::a-purpose::b01).
 * The taxpayer states each amount. A military move is an Armed Forces move fact
 * (armedForcesMove.ts), which files FTB 3913 too.
 */

import type { ArmedForcesMoveTravel } from "./armedForcesMove.js";

type FactRow = { key: string; value: unknown; category: string };

export interface CaWorkMoveFactValue {
  /* The taxpayer's name for the move: "Sacramento to Fresno". */
  description: string;
  /*
   * Distance Test Worksheet line 1: miles from the old home to the new
   * workplace, by the shortest of the commonly traveled routes
   * (ca-3913-inst-2025::sec::distance-test::b01, ::distance-test-worksheet::b01).
   */
  milesOldHomeToNewWorkplace: number;
  /* Worksheet line 2: miles from the old home to the old workplace. Absent: no old workplace (0). */
  milesOldHomeToOldWorkplace?: number;
  /*
   * The time test: true when the taxpayer met it, expects to meet it, or an
   * exception applies (a retiree or survivor living outside the United States
   * among them) (ca-3913-inst-2025::sec::time-test::b01,
   * ::what-if-you-do-not-meet-the-time-test-before-your-return-is-due::b01,
   * ::exceptions-to-the-time-test::b01). False: no deduction and no form.
   */
  meetsTimeTest?: boolean;
  /*
   * Line 1: what the taxpayer paid to pack, crate, move, store and insure
   * household goods and personal effects (storage within 30 days in a row, or
   * longer for a foreign move). Not services the employer provided
   * (ca-3913-inst-2025::sec::line-1 and its parts).
   */
  householdGoods: number;
  /* Line 2 parts, the same as Form 3903 (ca-3913-inst-2025::sec::line-2::b01). */
  travel: ArmedForcesMoveTravel;
  /*
   * Line 4: what the employer paid for the line 1 and line 2 expenses that is
   * not in W-2 box 1 (the form's line 4). 0 is an answer; absent, the form waits.
   */
  employerPaidNotInWages?: number;
}

export interface CaWorkMoveFact {
  key: string;
  value: CaWorkMoveFactValue;
}

const MOVE_CATEGORY = "other";
const MOVE_PREFIX = "ca_work_move.";

export function makeCaWorkMoveFactKey(moveSlug: string): string {
  return `${MOVE_PREFIX}${moveSlug}`;
}

export function isCaWorkMoveFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === MOVE_PREFIX && parts[1] !== "";
}

/* Every work move fact, in the order recorded. */
export function getCaWorkMoveFacts(facts: ReadonlyArray<FactRow>): CaWorkMoveFact[] {
  return facts
    .filter((row) => row.category === MOVE_CATEGORY && isCaWorkMoveFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CaWorkMoveFactValue }));
}
