/*
 * Form 2106 Part II, Sections A–C: one vehicle column, and Section B for the
 * vehicles on the standard mileage rate (irs-2106-inst-2025::sec::part-ii-vehicle-expenses::b01).
 */

import type { Form2106Vehicle } from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";
import { sectionDLines, type SectionDLines } from "./depreciation.js";

/* Line 22: "Multiply line 13 by 70¢ (0.70)" (irs-2106-inst-2025::sec::what-s-new::b01). */
export const STANDARD_MILEAGE_RATE_2025 = 0.7;
/* Line 14 converted to business use during the year: the months of business use over 12 (line-14::b01). */
const MONTHS_PER_YEAR = 12;
/* Line 14 is printed as a percentage with two decimals, so the ratio keeps four. */
const BUSINESS_USE_PLACES = 4;
const PERCENT_HUNDREDTHS = 10_000;
const HUNDREDTHS_PER_PERCENT = 100;
/* "If you used more than two vehicles, complete and attach a second Form 2106, page 2" (section-a-general-information::b01). */
export const VEHICLES_PER_PAGE = 2;

export interface SectionCLines {
  line23?: number;
  line24a?: number;
  line24b?: number;
  line24c?: number;
  line25?: number;
  line26: number;
  line27: number;
  line28?: number;
  line29: number;
}

export interface VehicleLines {
  /* Line 11 as printed: month, day, year. */
  placedInService: { month: string; day: string; year: string };
  line12: number;
  line13: number;
  /* Line 14 as a ratio (four places) and as printed ("75.00"). */
  businessUse: number;
  line14: string;
  line15?: number;
  line16?: number;
  line17: number;
  standardMileage: boolean;
  /* This vehicle's line 22 share before rounding: line 13 × $0.70. */
  standardMileageAmount?: number;
  sectionC?: SectionCLines;
  sectionD?: SectionDLines;
}

/* Line 14: line 13 ÷ line 12, times months/12 after a change to business use (line-14::b01). */
export function businessUseRatio(vehicle: Form2106Vehicle): number {
  const months = vehicle.businessMonths ?? MONTHS_PER_YEAR;
  return roundToPlaces(
    (vehicle.businessMiles / vehicle.totalMiles) * (months / MONTHS_PER_YEAR),
    BUSINESS_USE_PLACES,
  );
}

/* Line 14 printed: the ratio as a percentage with two decimals. */
export function percentText(ratio: number): string {
  const hundredths = roundDollars(ratio * PERCENT_HUNDREDTHS);
  const fraction = hundredths % HUNDREDTHS_PER_PERCENT;
  return `${(hundredths - fraction) / HUNDREDTHS_PER_PERCENT}.${String(fraction).padStart(2, "0")}`;
}

/* Line 16: the stated miles, else the commuting days × line 15 (irs-2106-inst-2025::sec::line-16::b01). */
export function commutingMiles(vehicle: Form2106Vehicle): number | undefined {
  if (vehicle.commutingMiles !== undefined) return vehicle.commutingMiles;
  if (vehicle.commutingDays === undefined || vehicle.averageDailyCommute === undefined) {
    return undefined;
  }
  return vehicle.commutingDays * vehicle.averageDailyCommute;
}

/* Why a vehicle's column cannot be figured, or undefined. */
export function vehicleGap(vehicle: Form2106Vehicle): string | undefined {
  if (!(vehicle.totalMiles > 0)) return "A vehicle states no total miles for line 12.";
  if (vehicle.method === "standard_mileage" && vehicle.ownership === "employer_provided") {
    return "An employer-provided vehicle cannot use the standard mileage rate (irs-pub-463-2025::sec::actual-car-expenses::b01).";
  }
  if (
    vehicle.method === "actual_expenses" &&
    vehicle.ownership === "owned" &&
    vehicle.depreciation === undefined
  ) {
    return "An owned vehicle on actual expenses states no depreciation for Section D (irs-pub-463-2025::sec::completing-form-2106::b04).";
  }
  return undefined;
}

/*
 * Section C (irs-2106-inst-2025::sec::line-23::b01 through ::line-28::b01): line
 * 24c = 24a − 24b; line 26 = 23 + 24c + 25; line 27 = line 26 × line 14; line 28
 * = line 38 (0 for a fully depreciated car); line 29 = 27 + 28.
 */
export function sectionCLines(
  vehicle: Form2106Vehicle,
  businessUse: number,
  sectionD: SectionDLines | undefined,
): SectionCLines {
  const line23 = roundDollars(vehicle.operatingExpenses);
  const line24a = roundDollars(vehicle.rentalCost);
  const line24b = roundDollars(vehicle.inclusionAmount);
  const line24c = line24a === undefined ? undefined : line24a - (line24b ?? 0);
  const line25 = roundDollars(vehicle.employerProvidedValue);
  const line26 = sum(line23, line24c, line25);
  const line27 = roundDollars(line26 * businessUse);
  const owned = vehicle.ownership === "owned";
  const fullyDepreciated = vehicle.depreciation?.fullyDepreciated === true;
  const line28 = !owned ? undefined : fullyDepreciated ? 0 : sectionD?.line38;
  return {
    line23,
    line24a,
    line24b,
    line24c,
    line25,
    line26,
    line27,
    line28,
    line29: line27 + (line28 ?? 0),
  };
}

/* One vehicle's column, or why it cannot be figured. */
export function vehicleLines(vehicle: Form2106Vehicle, ownerWages: number): VehicleLines | string {
  const gap = vehicleGap(vehicle);
  if (gap) return gap;
  const businessUse = businessUseRatio(vehicle);
  const [year = "", month = "", day = ""] = vehicle.placedInService.split("-");
  const line16 = commutingMiles(vehicle);
  const base: VehicleLines = {
    placedInService: { month, day, year },
    line12: vehicle.totalMiles,
    line13: vehicle.businessMiles,
    businessUse,
    line14: percentText(businessUse),
    line15: vehicle.averageDailyCommute,
    line16,
    line17: atLeast(0, vehicle.totalMiles - vehicle.businessMiles - (line16 ?? 0)),
    standardMileage: vehicle.method === "standard_mileage",
  };
  if (base.standardMileage) {
    return { ...base, standardMileageAmount: vehicle.businessMiles * STANDARD_MILEAGE_RATE_2025 };
  }
  const depreciation = vehicle.depreciation;
  let sectionD: SectionDLines | undefined;
  if (vehicle.ownership === "owned" && depreciation && !depreciation.fullyDepreciated) {
    const figured = sectionDLines({
      depreciation,
      placedInService: vehicle.placedInService,
      businessUse,
      ownerWages,
    });
    if (typeof figured === "string") return figured;
    sectionD = figured;
  }
  return { ...base, sectionC: sectionCLines(vehicle, businessUse, sectionD), sectionD };
}

/* Line 22: the standard-mileage vehicles' business miles × $0.70, rounded once; undefined with none. */
export function line22(vehicles: ReadonlyArray<VehicleLines>): number | undefined {
  const amounts = vehicles.filter((each) => each.standardMileage);
  if (amounts.length === 0) return undefined;
  return roundDollars(sum(...amounts.map((each) => each.standardMileageAmount)));
}
