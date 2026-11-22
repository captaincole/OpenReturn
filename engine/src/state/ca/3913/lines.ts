/*
 * FTB 3913 arithmetic. Lines 1 to 5 are the lines of federal Form 3903, and the
 * FTB instructions give the same rules for them (line 2 parts, the excluded
 * allowances, line 4, line 5), so the engine figures them with the Form 3903
 * functions at California's mileage rate.
 */

import type { ArmedForcesMoveTravel } from "../../../facts/index.js";
import {
  form3903Lines,
  travelExpenses,
  type Form3903Lines,
  type MoveAmounts,
} from "../../../federal/3903/lines.js";
import { atLeast, sum } from "../../../money.js";

/*
 * "For January 1, 2025, through December 31, 2025, the standard mileage rate for
 * using your vehicle to move to a new home is 21 cents a mile"
 * (ca-3913-inst-2025::sec::what-s-new::b01; line-2::b01).
 */
export const CA_STANDARD_MILEAGE_RATE_2025 = 0.21;

/*
 * Distance Test Worksheet line 3: "Is line 3 at least 50 miles?"
 * (ca-3913-inst-2025::sec::distance-test-worksheet::b01; distance-test::b01).
 */
export const DISTANCE_TEST_MILES = 50;

/*
 * Worksheet line 3: line 1 (old home to new workplace) less line 2 (old home to
 * old workplace), "If zero or less, enter -0-". No old workplace: line 2 is 0
 * ("If you did not have an old workplace, your new workplace must be at least
 * 50 miles from your old home", distance-test::b01).
 */
export function distanceTestLine3(
  milesToNewWorkplace: number,
  milesToOldWorkplace: number | undefined,
): number {
  return atLeast(0, milesToNewWorkplace - sum(milesToOldWorkplace));
}

/* "Yes. You meet this test." when line 3 is at least 50 miles. */
export function meetsDistanceTest(
  milesToNewWorkplace: number,
  milesToOldWorkplace: number | undefined,
): boolean {
  return distanceTestLine3(milesToNewWorkplace, milesToOldWorkplace) >= DISTANCE_TEST_MILES;
}

/*
 * Line 2 before rounding: fares, lodging, the own-vehicle amount by one method
 * (gas and oil, or miles at 21 cents), and parking fees and tolls "under either
 * method" (ca-3913-inst-2025::sec::line-2::b01; travel::b01). Never meals.
 */
export function caTravelExpenses(
  travel: ArmedForcesMoveTravel,
  mileageRate: number = CA_STANDARD_MILEAGE_RATE_2025,
): number {
  return travelExpenses(travel, mileageRate);
}

export type Form3913Lines = Form3903Lines;

/*
 * Lines 1 to 5 of one FTB 3913. Lines 1 and 2 leave out expenses paid by an
 * allowance that is not income (ca-3913-inst-2025::sec::storage-fees::b01,
 * line-2::b01); line 3 adds them; line 4 is what the employer or government
 * paid that is not in W-2 box 1 (the form; line-4::b01). Line 5 on Yes (line 3
 * more than line 4) is line 3 − line 4; on No there is no deduction, and line 4
 * − line 3, when more than 0, is the excess reimbursement (line-5::b01).
 */
export function form3913Lines(amounts: MoveAmounts): Form3913Lines {
  return form3903Lines(amounts);
}

/* One filed FTB 3913: its lines and the "military member" answer. */
export interface MoveForm {
  military: boolean;
  lines: Form3913Lines;
}

/*
 * Schedule CA (540) line 14 column C: line 5 of each non-military FTB 3913.
 * "If you checked the Yes box for military member, you have no California
 * adjustment" (ca-3913-inst-2025::sec::line-5::b01;
 * ca-540-sched-ca-inst-2025::sec::line-11-through-line-25::b02).
 */
export function scheduleCaLine14Addition(forms: ReadonlyArray<MoveForm>): number | undefined {
  const deductions = forms
    .filter((form) => !form.military)
    .map((form) => form.lines.line5)
    .filter((line5) => line5 !== undefined);
  return deductions.length === 0 ? undefined : sum(...deductions);
}

/*
 * Schedule CA (540) line 1h column C: on No, line 4 − line 3 of each
 * non-military FTB 3913 when more than 0 (the form, line 5 No; line-5::b01).
 */
export function scheduleCaLine1hAddition(forms: ReadonlyArray<MoveForm>): number | undefined {
  const excess = forms
    .filter((form) => !form.military)
    .map((form) => form.lines.excessReimbursement)
    .filter((each) => each !== undefined);
  return excess.length === 0 ? undefined : sum(...excess);
}
