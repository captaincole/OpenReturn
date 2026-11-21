/*
 * Form 3903: moving expenses of a member of the Armed Forces on active duty who
 * moves, by a military order, because of a permanent change of station
 * (irs-3903-inst-2025::sec::purpose-of-form::b01). One fact per move: "If you
 * qualify to deduct expenses for more than one move, use a separate Form 3903
 * for each move." The taxpayer states each amount.
 *
 * Schedule 1 line 14 also takes storage fees alone, with no Form 3903, when all
 * three conditions of irs-3903-inst-2025::sec::line-1::b01 apply (an earlier-year
 * move, only storage fees during the absence from the United States, any
 * government payment for them in W-2 box 1). Cade checks the conditions and
 * records that amount under ARMED_FORCES_STORAGE_FEES_KEY.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Line 2 parts (irs-3903-inst-2025::sec::line-2::b01). Each is optional: absent means none. */
export interface ArmedForcesMoveTravel {
  /* Airfare, train or bus fares for one trip per household member. */
  fares?: number;
  /* Lodging on the way, the day of arrival included. Never meals. */
  lodging?: number;
  /* Own vehicle(s), standard mileage method: the miles driven. */
  vehicleMiles?: number;
  /* Own vehicle(s), actual method: gas and oil paid. */
  vehicleGasAndOil?: number;
  /* Added under either vehicle method. */
  parkingAndTolls?: number;
}

export interface ArmedForcesMoveFactValue {
  /* The member's name for the move: "Fort A to Base B". */
  description: string;
  /*
   * The box above line 1: the member certifies active duty, a military order and
   * a permanent change of station (irs-3903-inst-2025::sec::specific-instructions::b01).
   * A move the member does not certify files no Form 3903.
   */
  certifiesRequirements: boolean;
  /*
   * Line 1: what the member paid to pack, crate, move, store and insure household
   * goods and personal effects (storage within 30 days in a row, or longer for a
   * move outside the United States). Not services the government provided
   * (irs-3903-inst-2025::sec::line-1::b01, b02). An excluded allowance is stated
   * on its own (excludedAllowances), not taken off here.
   */
  householdGoods: number;
  travel: ArmedForcesMoveTravel;
  /*
   * Allowances for the move that are not income: a dislocation allowance, a
   * temporary lodging allowance or expense, a move-in housing allowance
   * (irs-3903-inst-2025::sec::purpose-of-form::b02). Lines 1 and 2 leave out the
   * expenses they paid ("don't include any expenses that were reimbursed by an
   * allowance you don't have to include in your income", line-1::b02, line-2::b01),
   * so the engine takes this amount off line 1, then line 2. Never on line 4.
   * Absent: none. householdGoods and travel are what the member paid in full.
   */
  excludedAllowances?: number;
  /*
   * Line 4: reimbursements and allowances from the government for the expenses
   * on lines 1 and 2 that are not in W-2 box 1. Not services in kind, and not a
   * dislocation allowance, temporary lodging allowance or expense, or move-in
   * housing allowance (irs-3903-inst-2025::sec::line-4::b01). Absent: the W-2
   * box 12 code P total, the place the form names for it.
   */
  governmentReimbursements?: number;
}

export interface ArmedForcesMoveFact {
  key: string;
  value: ArmedForcesMoveFactValue;
}

const MOVE_CATEGORY = "other";
const MOVE_PREFIX = "armed_forces_move.";

/* Schedule 1 line 14 with its storage-fees box: the fees, a number (irs-1040-inst-2025::sec::line-14::b01). */
export const ARMED_FORCES_STORAGE_FEES_KEY = "adjustments.armed_forces_storage_fees_only";

export function makeArmedForcesMoveFactKey(moveSlug: string): string {
  return `${MOVE_PREFIX}${moveSlug}`;
}

export function isArmedForcesMoveFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === MOVE_PREFIX && parts[1] !== "";
}

/* Every move fact, in the order recorded: the order of the Forms 3903. */
export function getArmedForcesMoveFacts(facts: ReadonlyArray<FactRow>): ArmedForcesMoveFact[] {
  return facts
    .filter((row) => row.category === MOVE_CATEGORY && isArmedForcesMoveFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as ArmedForcesMoveFactValue }));
}
