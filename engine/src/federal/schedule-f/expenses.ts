/*
 * Schedule F Part II: farm expenses, cash and accrual method alike. Each line
 * is whole dollars; line 33 adds the rounded lines.
 */

import type { FarmExpenses, FarmFactValue, FarmOtherExpense } from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";
import { grossIncome, grossIncomeWaits } from "./income.js";

/* irs-1040sf-inst-2025::sec::what-s-new::b01: "The business standard mileage rate is 70 cents a mile for 2025." */
export const STANDARD_MILEAGE_RATE = 0.7;

/*
 * Line 12: "Your deduction can't exceed 25% of your gross income from farming"
 * (irs-1040sf-inst-2025::sec::line-12::b02; irs-pub-225-2025::sec::assessment-for-depreciable::b07).
 */
export const CONSERVATION_LIMIT_RATE = 0.25;

/* Lines 32a to 32f. */
export const OTHER_EXPENSE_ROWS = 6;

/* Line 32f's label for capitalized costs (irs-1040sf-inst-2025::sec::part-ii::b03). */
export const SECTION_263A_LABEL = "263A";

/*
 * Line 10 (irs-1040sf-inst-2025::sec::line-10::b01): the standard mileage rate
 * (70 cents a mile for 2025) times the business miles of each vehicle on that
 * rate, plus every vehicle's parking fees and tolls, plus the actual expenses.
 * Cents are kept until the total.
 */
export function carAndTruckExpenses(farm: FarmFactValue): number | undefined {
  const vehicles = farm.vehicles ?? [];
  const mileage = vehicles
    .filter((vehicle) => vehicle.standardMileageRate)
    .map((vehicle) => vehicle.businessMiles * STANDARD_MILEAGE_RATE);
  const parkingAndTolls = vehicles.map((vehicle) => vehicle.parkingAndTolls);
  return roundDollars(sumOrBlank(farm.expenses?.carAndTruck, ...mileage, ...parkingAndTolls));
}

/*
 * Line 12: this year's conservation expenses plus the carryover, at most 25% of
 * gross income from farming: line 9 plus the Form 4797 gains from draft,
 * breeding or dairy livestock (Pub. 225's example: $85,000 + $15,000 gives a
 * $25,000 limit). Undefined while line 9 waits.
 */
export function conservationDeduction(farm: FarmFactValue): number | undefined {
  const conservation = farm.conservation;
  if (conservation === undefined || grossIncomeWaits(farm)) return undefined;
  const line9 = grossIncome(farm);
  const grossFromFarming = sum(line9, conservation.livestockGains);
  const limit = atLeast(0, grossFromFarming * CONSERVATION_LIMIT_RATE);
  return roundDollars(Math.min(sum(conservation.expenses, conservation.carryover), limit));
}

/* The conservation expenses over the limit, carried to 2026 (::assessment-for-depreciable::b08, ::b09). */
export function conservationCarriedForward(farm: FarmFactValue): number | undefined {
  const conservation = farm.conservation;
  const deducted = conservationDeduction(farm);
  if (conservation === undefined || deducted === undefined) return undefined;
  return atLeast(0, roundDollars(sum(conservation.expenses, conservation.carryover)) - deducted);
}

/* Line 15: less the Form 8941 credit (irs-1040sf-inst-2025::sec::line-15::b01). */
export function employeeBenefits(farm: FarmFactValue): number | undefined {
  const stated = farm.expenses?.employeeBenefitPrograms;
  if (stated === undefined) return undefined;
  return roundDollars(atLeast(0, stated - sum(farm.smallEmployerHealthCredit)));
}

/* Line 22: labor hired less the employment credits (irs-1040sf-inst-2025::sec::line-22::b01). */
export function laborHired(farm: FarmFactValue): number | undefined {
  const stated = farm.expenses?.laborHired;
  if (stated === undefined) return undefined;
  return roundDollars(atLeast(0, stated - sum(farm.employmentCredits)));
}

/* Line 14 waits for whether Form 4562 is needed; with new property it is a gap (lines.ts). */
export const depreciationWaits = (farm: FarmFactValue) =>
  (farm.expenses?.depreciation ?? 0) > 0 && farm.newDepreciableProperty === undefined;

/* The lines that take a stated amount as it is, by catalog field. */
export const STATED_LINES: ReadonlyArray<[string, keyof FarmExpenses]> = [
  ["0.line.11_chemicals", "chemicals"],
  ["0.line.13_custom_hire_expense", "customHire"],
  ["0.line.14_depreciation_section_179", "depreciation"],
  ["0.line.16_feed", "feed"],
  ["0.line.17_fertilizers_lime", "fertilizersAndLime"],
  ["0.line.18_freight_trucking", "freightAndTrucking"],
  ["0.line.19_gasoline_fuel_oil", "gasolineFuelAndOil"],
  ["0.line.20_insurance_other_than_health", "insurance"],
  ["0.line.21a_interest_mortgage", "mortgageInterest"],
  ["0.line.21b_interest_other", "otherInterest"],
  ["0.line.23_pension_profit_sharing", "pensionAndProfitSharing"],
  ["0.line.24a_rent_vehicles_machinery_equipment", "rentVehiclesMachinery"],
  ["0.line.24b_rent_other", "rentOther"],
  ["0.line.25_repairs_maintenance", "repairs"],
  ["0.line.26_seeds_plants", "seedsAndPlants"],
  ["0.line.27_storage_warehousing", "storageAndWarehousing"],
  ["0.line.28_supplies", "supplies"],
  ["0.line.29_taxes", "taxes"],
  ["0.line.30_utilities", "utilities"],
  ["0.line.31_veterinary_breeding_medicine", "veterinaryBreedingMedicine"],
];

/*
 * Lines 32a to 32f in order: the other expenses, then the capitalized costs on
 * line 32f, negative, labeled "263A" (irs-1040sf-inst-2025::sec::part-ii::b03).
 */
export function otherExpenseRows(farm: FarmFactValue): FarmOtherExpense[] {
  const capitalized = roundDollars(farm.section263ACapitalized);
  const stated = (farm.otherExpenses ?? []).map((row) => ({
    description: row.description,
    amount: roundDollars(row.amount),
  }));
  return capitalized === undefined || capitalized === 0
    ? stated
    : [...stated, { description: SECTION_263A_LABEL, amount: 0 - capitalized }];
}

/* The rows do not fit lines 32a to 32f (line 32f is only for the capitalized costs then). */
export function otherExpensesOverflow(farm: FarmFactValue): boolean {
  const capitalized = (farm.section263ACapitalized ?? 0) > 0;
  const room = capitalized ? OTHER_EXPENSE_ROWS - 1 : OTHER_EXPENSE_ROWS;
  return (farm.otherExpenses ?? []).length > room;
}

/* One row of lines 32a to 32f; the capitalized costs are always on 32f. */
export function otherExpenseRow(farm: FarmFactValue, row: number): FarmOtherExpense | undefined {
  const rows = otherExpenseRows(farm);
  const capitalized = (farm.section263ACapitalized ?? 0) > 0;
  if (capitalized && row === OTHER_EXPENSE_ROWS) return rows[rows.length - 1];
  if (capitalized && row > rows.length - 1) return undefined;
  return rows[row - 1];
}

/*
 * Line 33: lines 10 through 32f; "If line 32f is a negative amount, subtract it
 * from the total of lines 10 through 32e" (irs-1040sf-inst-2025::sec::line-33::b01),
 * which adding the negative row does. Blank when the farm states no expense.
 */
export function totalExpenses(farm: FarmFactValue): number | undefined {
  return sumOrBlank(
    carAndTruckExpenses(farm),
    conservationDeduction(farm),
    employeeBenefits(farm),
    laborHired(farm),
    ...STATED_LINES.map(([, key]) => roundDollars(farm.expenses?.[key])),
    ...otherExpenseRows(farm).map((row) => row.amount),
  );
}
