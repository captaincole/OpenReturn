/*
 * Schedule C net profit from a business fact, for the forms that need it before
 * Schedule C is evaluated (Schedule SE must-file, Schedule 1 line 3). It follows
 * the form's lines with each line rounded. The home office (line 30) is the
 * simplified method or Form 8829 (federal/8829/lines.ts); line 13 and the Part V
 * amortization come from Form 4562 (attachments.ts). Cost of goods sold (line 4,
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
import { form8829Figures, homeOfficeActualGap, sharedHomeGap } from "../8829/lines.js";
import { line13Depreciation, partVEntries } from "./attachments.js";

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

/* Line 27b: the Part V total (line 48), each listed amount rounded, amortization included. */
export function otherExpensesTotal(business: BusinessFactValue): number | undefined {
  return sumOrBlank(...partVEntries(business).map((entry) => roundDollars(entry.amount)));
}

/* Line 9 and line 13 are figured, not read from expenses. */
const FIGURED_LINES: ReadonlyArray<keyof BusinessExpenses> = ["carAndTruck", "depreciation"];

/*
 * Line 28: lines 8 through 27b; blank when the business states no expense, and
 * undefined while line 13 waits for Form 4562 (an answer, or a gap). A business
 * with nothing to depreciate adds no line 13.
 */
export function totalExpenses(business: BusinessFactValue): number | undefined {
  // Line 9 adds the standard mileage amounts to expenses.carAndTruck.
  const partII = Object.entries(business.expenses ?? {}).filter(
    ([key]) => !FIGURED_LINES.includes(key as keyof BusinessExpenses),
  );
  const line13 = line13Depreciation(business);
  if (line13.kind !== "amount") return undefined;
  return sumOrBlank(
    ...partII.map(([, amount]) => roundDollars(amount)),
    carAndTruckExpenses(business),
    line13.amount,
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
  if (line7 === undefined || line13Depreciation(business).kind !== "amount") return undefined;
  return line7 - (totalExpenses(business) ?? 0);
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
 * Worksheet line 2 for this business and each other home office of its owner:
 * spouses each elect (irs-1040sc-inst-2025::sec::line-30::b02), so the 300
 * square-foot cap for all of one person's businesses in the home
 * (line-30::b03) is per owner. The fact's homes are taken to be one home.
 */
function ownerSquareFeet(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): Array<number | undefined> {
  const sharing = onReturn.filter(
    (other) => other !== business && other.homeOffice && ownerOf(other) === ownerOf(business),
  );
  return [business, ...sharing].map((each) =>
    each.homeOffice ? allowableSquareFeet(each.homeOffice) : undefined,
  );
}

/* Worksheet line 2 within the cap; blank while an area is unknown or above the cap. */
function cappedSquareFeet(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  const areas = ownerSquareFeet(business, onReturn);
  if (areas.some((area) => area === undefined)) return undefined;
  return sum(...areas) > SIMPLIFIED_METHOD_MAX_SQUARE_FEET ? undefined : areas[0];
}

/*
 * Why line 30 (and so line 31) is a case the engine does not handle: not all
 * gross income is from the home (irs-1040sc-inst-2025::sec::line-1-2::b02), or
 * the owner's offices exceed the cap and the allocation is the taxpayer's
 * choice (line-30::b03). Undefined when line 30 can be figured or still waits
 * for an answer.
 */
export function homeOfficeGap(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): "partOfIncomeFromHome" | "areaAllocation" | undefined {
  if (!business.homeOffice) return undefined;
  if (business.homeOffice.allGrossIncomeFromHome === false) return "partOfIncomeFromHome";
  const areas = ownerSquareFeet(business, onReturn);
  if (areas.some((area) => area === undefined)) return undefined;
  return sum(...areas) > SIMPLIFIED_METHOD_MAX_SQUARE_FEET ? "areaAllocation" : undefined;
}

/*
 * Line 30 by Form 8829 (irs-1040sc-inst-2025::sec::line-30::b01: "include the
 * amount from line 36 of your Form 8829 on line 30"), for a home office by actual
 * expenses. Undefined while line 29 or an answer waits, or for a case Form 8829's
 * lines do not handle (homeOfficeActualGap).
 */
function form8829Line36(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  const office = business.homeOfficeActual;
  const line29 = tentativeProfit(business);
  if (!office || line29 === undefined) return undefined;
  if (office.ownsHome !== false || office.allGrossIncomeFromHome !== true) return undefined;
  if (homeOfficeActualGap(office) || sharedHomeGap(business, onReturn)) return undefined;
  return form8829Figures(office, line29).line36;
}

/*
 * Line 30 by the Simplified Method Worksheet (line 5: the smaller of line 1 or
 * line 4, -0- if zero or less). Line 1 is line 29 only when all the business's
 * gross income is from the home use (irs-1040sc-inst-2025::sec::line-1-2::b01),
 * and no fact ties a Form 8949 or 4797 gain or loss to the business. Otherwise
 * line 1 needs the part of gross income from the home (line-1-2::b02), which no
 * fact gives, so line 30 is blank (homeOfficeGap says why). Line 3b is 1.0:
 * the fact's area is used regularly and exclusively. onReturn is every business on the return.
 */
export function homeOfficeExpenses(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  if (business.homeOfficeActual) return form8829Line36(business, onReturn);
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
 * a loss waits for the at-risk and passive loss rules. With line G "Yes" and all
 * investment at risk (box 32a), neither reduces the loss
 * (irs-1040sc-inst-2025::sec::line-32::b02), so line 31 takes it. Form 6198 (box
 * 32b) and Form 8582 (line G "No") are not modeled: line 31 stays blank then, and
 * a profit with line G "No" (or unanswered) may carry prior-year passive losses.
 * A home office whose line 30 is blank leaves line 31 blank too. Schedule SE line
 * 2 and Schedule 1 line 3 take this amount.
 */
export function netProfit(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): number | undefined {
  const line29 = tentativeProfit(business);
  const line30 = homeOfficeExpenses(business, onReturn);
  if (line29 === undefined || business.materiallyParticipated !== true) return undefined;
  const hasOffice = business.homeOffice !== undefined || business.homeOfficeActual !== undefined;
  if (hasOffice && line30 === undefined) return undefined;
  const line31 = line29 - (line30 ?? 0);
  return line31 < 0 && business.allInvestmentAtRisk !== true ? undefined : line31;
}
