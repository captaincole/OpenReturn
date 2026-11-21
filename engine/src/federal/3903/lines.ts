import type { ArmedForcesMoveTravel } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * Line 2: "Mileage at the rate of 21 cents a mile" for the member's own vehicle
 * in 2025 (irs-3903-inst-2025::sec::line-2::b01; what-s-new::b01).
 */
export const STANDARD_MILEAGE_RATE_2025 = 0.21;

/*
 * "If you use your own vehicle(s), you can figure the expenses by using either:
 * actual out-of-pocket expenses for gas and oil, or mileage" (line-2::b01).
 * A move that states both has no rule for which one counts.
 */
export function namesBothVehicleMethods(travel: ArmedForcesMoveTravel): boolean {
  return typeof travel.vehicleMiles === "number" && typeof travel.vehicleGasAndOil === "number";
}

/*
 * Line 2 before rounding: fares, lodging, the own-vehicle amount by one method,
 * and parking fees and tolls ("You can add parking fees and tolls to the amount
 * claimed under either method", line-2::b01). Meals are never part of it.
 */
export function travelExpenses(
  travel: ArmedForcesMoveTravel,
  mileageRate: number = STANDARD_MILEAGE_RATE_2025,
): number {
  const mileage =
    typeof travel.vehicleMiles === "number" ? travel.vehicleMiles * mileageRate : undefined;
  return sum(
    travel.fares,
    travel.lodging,
    mileage,
    travel.vehicleGasAndOil,
    travel.parkingAndTolls,
  );
}

/* One Form 3903's amounts, before the whole-dollar rounding of each line. */
export interface MoveAmounts {
  householdGoods: number;
  travel: number;
  governmentReimbursements: number;
  /* Allowances that are not income (dislocation, temporary lodging, move-in housing). */
  excludedAllowances?: number;
}

/*
 * Lines 1 and 2 leave out "any expenses that were reimbursed by an allowance you
 * don't have to include in your income" (irs-3903-inst-2025::sec::line-1::b02,
 * line-2::b01). The text does not say which line an allowance comes off: the
 * engine takes it off line 1 first, then line 2 (QUESTIONS.md). An allowance
 * over both lines leaves them at 0 and is not income
 * (purpose-of-form::b02: the line 1h excess is for amounts "other than
 * dislocation allowances, temporary lodging expenses, temporary lodging
 * allowances, or move-in housing allowances").
 */
function lessExcludedAllowances(amounts: MoveAmounts): { householdGoods: number; travel: number } {
  const allowances = atLeast(0, amounts.excludedAllowances);
  const householdGoods = atLeast(0, amounts.householdGoods - allowances);
  const leftForTravel = atLeast(0, allowances - amounts.householdGoods);
  return { householdGoods, travel: atLeast(0, amounts.travel - leftForTravel) };
}

export interface Form3903Lines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  /* Line 5, "Is line 3 more than line 4?" */
  line5Yes: boolean;
  /* Line 5 amount: printed only on Yes. */
  line5?: number;
  /* Line 4 − line 3 when it is more than 0: Form 1040 line 1h. */
  excessReimbursement?: number;
}

/*
 * Lines 1–5 (the blank form; irs-3903-inst-2025::sec::line-5::b01). Each amount
 * line is a sum of what was paid: cents kept, the total rounded. Line 5 on Yes is
 * line 3 − line 4, the moving expense deduction. On No (line 3 equal to or less
 * than line 4) there is no deduction, and "Subtract line 3 from line 4 and, if
 * the result is more than zero, enter it on Form 1040 ... line 1h."
 */
export function form3903Lines(amounts: MoveAmounts): Form3903Lines {
  const paid = lessExcludedAllowances(amounts);
  const line1 = roundDollars(paid.householdGoods);
  const line2 = roundDollars(paid.travel);
  const line3 = line1 + line2;
  const line4 = roundDollars(amounts.governmentReimbursements);
  const line5Yes = line3 > line4;
  return {
    line1,
    line2,
    line3,
    line4,
    line5Yes,
    line5: line5Yes ? line3 - line4 : undefined,
    excessReimbursement: line4 > line3 ? line4 - line3 : undefined,
  };
}

/* Schedule 1 line 14: "Carry the moving expense deduction from Form(s) 3903, line 5" (irs-pub-3-2025::sec::how-to-report-moving-expenses::b01). */
export function movingExpenseDeduction(forms: ReadonlyArray<Form3903Lines>): number | undefined {
  const deductions = forms.map((form) => form.line5).filter((line5) => line5 !== undefined);
  return deductions.length === 0 ? undefined : sum(...deductions);
}

/* Form 1040 line 1h: every Form 3903's excess reimbursement. */
export function excessReimbursements(forms: ReadonlyArray<Form3903Lines>): number | undefined {
  const excess = forms.map((form) => form.excessReimbursement).filter((each) => each !== undefined);
  return excess.length === 0 ? undefined : sum(...excess);
}
