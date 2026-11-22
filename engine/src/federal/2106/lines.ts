/*
 * Form 2106 Part I and where line 10 goes. Pure arithmetic: whole dollars, each
 * rule with its block id.
 */

import type {
  EmployeeBusinessExpensesFactValue,
  Form2106Reimbursements,
} from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";
import { STANDARD_MILEAGE_RATE_2025, type VehicleLines } from "./vehicle.js";

/* Line 9 column B: "Generally, you can deduct only 50% of your business meal expenses" (irs-2106-inst-2025::sec::line-9::b01). */
export const MEALS_DEDUCTIBLE_RATE = 0.5;
/* Hours of service limits: "use 80% instead of 50% for meals while away from your tax home" (irs-pub-463-2025::sec::completing-form-2106::b07). */
export const HOURS_OF_SERVICE_MEALS_RATE = 0.8;
/* Reimbursement Allocation Worksheet line 4: "a decimal (rounded to three places)" (reimbursement-allocation-worksheet::b01). */
const ALLOCATION_PLACES = 3;

/* The stated Part I amounts, before rounding. */
export interface PartIInputs {
  /* Line 1: Part II's vehicle expense (line 22 + line 29). */
  vehicleExpense?: number;
  parkingTollsTransportation?: number;
  overnightTravel?: number;
  otherExpenses?: number;
  meals?: number;
  reimbursements?: Form2106Reimbursements;
  mealsRate: number;
}

export interface Form2106PartI {
  line1?: number;
  line2?: number;
  line3?: number;
  line4?: number;
  line5?: number;
  line6a: number;
  line6b?: number;
  line7a?: number;
  line7b?: number;
  line8a: number;
  line8b?: number;
  line9a?: number;
  line9b?: number;
  line10?: number;
  /* Line 7 more than line 6 in column A: the excess goes on Form 1040 line 1a (line 8 on the form). */
  excessReimbursement?: number;
}

/*
 * The Reimbursement Allocation Worksheet (irs-2106-inst-2025::sec::reimbursement-allocation-worksheet::b01):
 * line 4 = meals ÷ expenses covered, three places; line 5 = line 1 × line 4 (column
 * B); line 6 = line 1 − line 5 (column A). Pub. 463's example: $7,000, $8,500,
 * $4,500 → 0.529, $3,703, $3,297 (irs-pub-463-2025::sec::reimbursement-allocation-worksheet::b01).
 */
export function allocateReimbursement(payment: {
  amount: number;
  coveredExpenses: number;
  coveredMeals: number;
}): { meals: number; otherThanMeals: number } {
  const line1 = roundDollars(payment.amount);
  const line4 =
    payment.coveredExpenses > 0
      ? roundToPlaces(payment.coveredMeals / payment.coveredExpenses, ALLOCATION_PLACES)
      : 0;
  const line5 = roundDollars(line1 * line4);
  return { meals: line5, otherThanMeals: line1 - line5 };
}

/* Line 7, both columns: the clearly identified amounts plus the allocated payment. */
export function line7(reimbursements: Form2106Reimbursements | undefined): {
  columnA?: number;
  columnB?: number;
} {
  if (!reimbursements) return {};
  const allocated = reimbursements.singlePayment
    ? allocateReimbursement(reimbursements.singlePayment)
    : undefined;
  const columnA = sum(roundDollars(reimbursements.otherThanMeals), allocated?.otherThanMeals);
  const columnB = sum(roundDollars(reimbursements.meals), allocated?.meals);
  return {
    columnA: columnA > 0 ? columnA : undefined,
    columnB: columnB > 0 ? columnB : undefined,
  };
}

/*
 * Lines 1–10 (the blank form). Line 6A = lines 1–4; 6B = line 5. Line 8 = line 6
 * − line 7, at least 0; when line 7A is more than 6A, the excess is income on
 * Form 1040 line 1a. "If both columns of line 8 are zero, you can't deduct
 * employee business expenses. Stop here." Line 9A = 8A; 9B = 8B × 50% (80%
 * under the hours of service limits). Line 10 = 9A + 9B.
 */
export function partILines(inputs: PartIInputs): Form2106PartI {
  const line1 = roundDollars(inputs.vehicleExpense);
  const line2 = roundDollars(inputs.parkingTollsTransportation);
  const line3 = roundDollars(inputs.overnightTravel);
  const line4 = roundDollars(inputs.otherExpenses);
  const line5 = roundDollars(inputs.meals);
  const line6a = sum(line1, line2, line3, line4);
  const line6b = line5;
  const { columnA: line7a, columnB: line7b } = line7(inputs.reimbursements);
  const line8a = atLeast(0, line6a - (line7a ?? 0));
  const line8b =
    line6b === undefined && line7b === undefined
      ? undefined
      : atLeast(0, (line6b ?? 0) - (line7b ?? 0));
  const excess = (line7a ?? 0) - line6a;
  const lines: Form2106PartI = {
    line1,
    line2,
    line3,
    line4,
    line5,
    line6a,
    line6b,
    line7a,
    line7b,
    line8a,
    line8b,
    excessReimbursement: excess > 0 ? excess : undefined,
  };
  if (line8a === 0 && !line8b) return lines;
  const line9a = line8a;
  const line9b = line8b === undefined ? undefined : roundDollars(line8b * inputs.mealsRate);
  return { ...lines, line9a, line9b, line10: line9a + (line9b ?? 0) };
}

/* Line 9B's rate. */
export function mealsRate(fact: EmployeeBusinessExpensesFactValue): number {
  return fact.hoursOfServiceLimits ? HOURS_OF_SERVICE_MEALS_RATE : MEALS_DEDUCTIBLE_RATE;
}

/*
 * The part of line 10 for impairment-related work expenses, which goes on
 * Schedule A line 16 (irs-2106-inst-2025::sec::line-10::b04). For an employee
 * whose qualification is impairment-related work expenses, all of line 10. For
 * another qualification, the impairment-related expenses inside line 4 take
 * their share of column A after reimbursements: line 9A × expenses ÷ line 6A
 * (QUESTIONS.md).
 */
export function impairmentShare(
  fact: EmployeeBusinessExpensesFactValue,
  lines: Form2106PartI,
): number {
  const line10 = lines.line10 ?? 0;
  if (fact.qualification === "impairment_related_work_expenses") return line10;
  const expenses = Math.min(atLeast(0, fact.impairmentRelatedWorkExpenses), lines.line4 ?? 0);
  if (expenses === 0 || lines.line6a === 0) return 0;
  return roundDollars(((lines.line9a ?? 0) * expenses) / lines.line6a);
}

export interface ReservistLimitInputs {
  lines: Form2106PartI;
  vehicles: ReadonlyArray<VehicleLines>;
  line22?: number;
  lodging: number;
  meals: number;
  perDiemLodging: number;
  perDiemMeals: number;
  mealsRate: number;
}

/*
 * A reservist's Schedule 1 line 12 amount "is limited to the regular federal per
 * diem rate (for lodging, meals, and incidental expenses) and the standard mileage
 * rate (for car expenses), plus any parking fees, ferry fees, and tolls"
 * (irs-2106-inst-2025::sec::line-10::b01, b02). The limit: lodging up to the
 * lodging per diem, meals up to the M&IE per diem at line 9B's rate, the rest of
 * line 3 (fares), line 2, and each vehicle up to its business miles × $0.70.
 * Line 4 is not travel and has no room in it (QUESTIONS.md).
 */
export function reservistLimit(inputs: ReservistLimitInputs): number {
  const { lines } = inputs;
  const lodging = Math.min(inputs.lodging, inputs.perDiemLodging);
  const meals = roundDollars(Math.min(inputs.meals, inputs.perDiemMeals) * inputs.mealsRate);
  const fares = atLeast(0, (lines.line3 ?? 0) - roundDollars(inputs.lodging));
  const actualVehicles = inputs.vehicles
    .filter((vehicle) => vehicle.sectionC !== undefined)
    .map((vehicle) =>
      Math.min(
        vehicle.sectionC?.line29 ?? 0,
        roundDollars(vehicle.line13 * STANDARD_MILEAGE_RATE_2025),
      ),
    );
  return sum(roundDollars(lodging), meals, fares, lines.line2, inputs.line22, ...actualVehicles);
}
