/*
 * Schedule C net profit from a business fact, for the forms that need it before
 * Schedule C is evaluated (Schedule SE must-file, Schedule 1 line 3). It follows
 * the form's lines with each line rounded. The home office (line 30) is the
 * simplified method only; Form 8829 is not modeled. Cost of goods sold (line 4,
 * Part III) is not modeled: a business that sells goods, or has not said, has
 * no line 5 yet.
 */

import {
  ownerOf,
  type BusinessExpenses,
  type BusinessFactValue,
  type HomeOfficeSimplified,
} from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";

// irs-1040sc-inst-2025::sec::what-s-new::b01: 70 cents per business mile for 2025.
export const STANDARD_MILEAGE_RATE = 0.7;
// irs-1040sc-inst-2025::sec::simplified-method-worksheet::b01: line 3a, $5 a square foot.
export const SIMPLIFIED_METHOD_RATE = 5;
// irs-1040sc-inst-2025::sec::line-2-2::b01: line 2 takes at most 300 square feet.
export const SIMPLIFIED_METHOD_MAX_SQUARE_FEET = 300;

/*
 * Line 9: actual expenses other than parking and tolls (expenses.carAndTruck),
 * plus every vehicle's parking fees and tolls, plus business miles × the rate for
 * each vehicle on the standard mileage rate. Parking and tolls count on either
 * method: an actual expense (irs-pub-463-2025::sec::actual-car-expenses::b01) and
 * an addition to the mileage amount (irs-1040sc-inst-2025::sec::line-9::b01).
 * The rule that five or more vehicles used at once must use actual expenses is
 * not checked. Cents are kept until the total.
 */
export function carAndTruckExpenses(business: BusinessFactValue): number | undefined {
  const vehicles = business.vehicles ?? [];
  const mileage = vehicles
    .filter((vehicle) => vehicle.standardMileageRate)
    .map((vehicle) => vehicle.businessMiles * STANDARD_MILEAGE_RATE);
  const parkingAndTolls = vehicles.map((vehicle) => vehicle.parkingAndTolls);
  return roundDollars(sumOrBlank(business.expenses?.carAndTruck, ...mileage, ...parkingAndTolls));
}

/* Line 27b: the Part V total (line 48), each listed amount rounded. */
export function otherExpensesTotal(business: BusinessFactValue): number | undefined {
  return sumOrBlank(...(business.otherExpenses ?? []).map((entry) => roundDollars(entry.amount)));
}

const LINE_9_KEY: keyof BusinessExpenses = "carAndTruck";

/* Line 28: lines 8 through 27b; blank when the business states no expense. */
export function totalExpenses(business: BusinessFactValue): number | undefined {
  // Line 9 adds the standard mileage amounts to expenses.carAndTruck.
  const partII = Object.entries(business.expenses ?? {}).filter(([key]) => key !== LINE_9_KEY);
  return sumOrBlank(
    ...partII.map(([, amount]) => roundDollars(amount)),
    carAndTruckExpenses(business),
    otherExpensesTotal(business),
  );
}

/* Line 3: line 1 less line 2. */
export function netReceipts(business: BusinessFactValue): number {
  return roundDollars(business.grossReceipts) - roundDollars(business.returnsAndAllowances ?? 0);
}

/* Line 5: line 3 less line 4. Only a business that sells no goods has no line 4. */
export function grossProfit(business: BusinessFactValue): number | undefined {
  return business.sellsGoods === false ? netReceipts(business) : undefined;
}

/* Line 7: line 5 plus line 6. */
export function grossIncome(business: BusinessFactValue): number | undefined {
  const line5 = grossProfit(business);
  return line5 === undefined ? undefined : line5 + roundDollars(business.otherIncome ?? 0);
}

/* Line 29: line 7 (gross income) less line 28 (total expenses). */
export function tentativeProfit(business: BusinessFactValue): number | undefined {
  const line7 = grossIncome(business);
  return line7 === undefined ? undefined : line7 - (totalExpenses(business) ?? 0);
}

/*
 * Worksheet line 2: the area used all year, or the average monthly allowable
 * area when it changed (irs-1040sc-inst-2025::sec::line-2-3::b06), at most 300.
 */
function allowableSquareFeet(office: HomeOfficeSimplified): number | undefined {
  const area = office.sameAreaAllYear ? office.businessSquareFeet : office.averageMonthlySquareFeet;
  if (office.sameAreaAllYear === undefined || area === undefined) return undefined;
  return Math.min(area, SIMPLIFIED_METHOD_MAX_SQUARE_FEET);
}

/*
 * Worksheet line 2 within the 300 square-foot cap for all of one person's
 * businesses in the home (irs-1040sc-inst-2025::sec::line-30::b03). Spouses each
 * elect (line-30::b02), so the cap is per owner. Above the cap the taxpayer
 * allocates the area among the businesses, and no fact gives that choice, so
 * line 2 is blank. The fact's homes are taken to be one home.
 */
function cappedSquareFeet(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  const sharing = onReturn.filter(
    (other) => other !== business && other.homeOffice && ownerOf(other) === ownerOf(business),
  );
  const areas = [business, ...sharing].map((each) =>
    each.homeOffice ? allowableSquareFeet(each.homeOffice) : undefined,
  );
  if (areas.some((area) => area === undefined)) return undefined;
  return sum(...areas) > SIMPLIFIED_METHOD_MAX_SQUARE_FEET ? undefined : areas[0];
}

/*
 * Line 30 by the Simplified Method Worksheet (line 5: the smaller of line 1 or
 * line 4, -0- if zero or less). Line 1 is line 29 only when all the business's
 * gross income is from the home use (irs-1040sc-inst-2025::sec::line-1-2::b01),
 * and no fact ties a Form 8949 or 4797 gain or loss to the business. Otherwise
 * line 1 needs the part of gross income from the home (line-1-2::b02), which no
 * fact gives, so line 30 is blank. Line 3b is 1.0: the fact's area is used
 * regularly and exclusively. onReturn is every business on the return.
 */
export function homeOfficeExpenses(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  const office = business.homeOffice;
  const line29 = tentativeProfit(business);
  if (!office || office.allGrossIncomeFromHome !== true || line29 === undefined) return undefined;
  const line2 = cappedSquareFeet(business, onReturn);
  if (line2 === undefined) return undefined;
  const line4 = line2 * SIMPLIFIED_METHOD_RATE;
  return roundDollars(atLeast(0, Math.min(line29, line4)));
}

/*
 * Line 31: line 29 less line 30. irs-1040sc-inst-2025::sec::line-31::b01–b02:
 * a loss waits for the at-risk and passive loss rules, and a business with line G
 * "No" (or unanswered) may carry prior-year passive losses (Form 8582). Neither is
 * modeled, so line 31 is blank in those cases. A home office whose line 30 is
 * blank leaves line 31 blank too. Schedule SE line 2 and Schedule 1 line 3 take
 * this amount.
 */
export function netProfit(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  const line29 = tentativeProfit(business);
  const line30 = homeOfficeExpenses(business, onReturn);
  if (line29 === undefined || business.materiallyParticipated !== true) return undefined;
  if (business.homeOffice && line30 === undefined) return undefined;
  const line31 = line29 - (line30 ?? 0);
  return line31 < 0 ? undefined : line31;
}
