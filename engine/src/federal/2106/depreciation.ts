/*
 * Form 2106 Part II, Section D: depreciation of an owned vehicle on the actual
 * expense method (irs-2106-inst-2025::sec::section-d-depreciation-of-vehicles::b01).
 * Pure arithmetic; each rule names its block.
 */

import type { Form2106VehicleDepreciation } from "../../facts/index.js";
import { atLeast, roundDollars } from "../../money.js";

/*
 * Line 36 for a car placed in service in 2025: $20,200 when the section 168(k)
 * special allowance applies, $12,200 when it does not
 * (irs-2106-inst-2025::sec::rev-proc-2025-16-table-1-depreciation::b01).
 */
export const FIRST_YEAR_LIMIT_WITH_SPECIAL_ALLOWANCE = 20_200;
export const FIRST_YEAR_LIMIT_WITHOUT_SPECIAL_ALLOWANCE = 12_200;

/*
 * Line 36 for a car placed in service before 2025: the 2025 column of the table
 * for cars acquired after September 27, 2017 (irs-pub-463-2025::sec::maximum-depreciation-deduction-for-2::b01;
 * the line 36 instructions send earlier cars to Pub. 463, ::line-36::b01). The
 * second and later years are the same in the table for cars acquired before
 * September 28, 2017 (::maximum-depreciation-deduction-for::b01).
 */
export const LIMIT_IN_2025_BY_YEAR_PLACED: Readonly<Record<number, number>> = {
  2024: 19_800,
  2023: 11_700,
  2022: 6_460,
  2021: 5_860,
  2020: 5_760,
};

/* "The portion of the vehicle's cost taken into account ... is limited to $31,300" (irs-2106-inst-2025::sec::line-31::b03). */
export const HEAVY_SUV_SECTION_179_COST_LIMIT = 31_300;

/*
 * The special allowance: 100% for property acquired after January 19, 2025,
 * 40% for property acquired before January 20, 2025
 * (irs-2106-inst-2025::sec::worksheet-for-the-special-depreciation-allowance::b01).
 */
export const FULL_SPECIAL_ALLOWANCE_RATE = 1;
export const REDUCED_SPECIAL_ALLOWANCE_RATE = 0.4;
export const FULL_RATE_ACQUIRED_FROM = "2025-01-20";

/* Section 179, the special allowance and the declining balance columns need business use over 50% (line-31::b02, line-33::b01). */
export const MORE_THAN_HALF = 0.5;

const TAX_YEAR = 2025;
const FIRST_MONTH_OF_LAST_QUARTER = 10;
const PERCENT = 100;

type ChartRow = Readonly<Record<Form2106VehicleDepreciation["method"], number>>;

/*
 * The Depreciation Method and Percentage Chart, line 33, in percent
 * (irs-2106-inst-2025::sec::depreciation-method-and-percentage-chart-line-33::b01):
 * a row for Jan. 1–Sept. 30 and one for Oct. 1–Dec. 31 of each year.
 */
const CHART: Readonly<Record<number, { janToSept: ChartRow; octToDec: ChartRow }>> = {
  2025: {
    octToDec: { "200_db": 5, "150_db": 3.75, straight_line: 2.5 },
    janToSept: { "200_db": 20, "150_db": 15, straight_line: 10 },
  },
  2024: {
    octToDec: { "200_db": 38, "150_db": 28.88, straight_line: 20 },
    janToSept: { "200_db": 32, "150_db": 25.5, straight_line: 20 },
  },
  2023: {
    octToDec: { "200_db": 22.8, "150_db": 20.21, straight_line: 20 },
    janToSept: { "200_db": 19.2, "150_db": 17.85, straight_line: 20 },
  },
  2022: {
    octToDec: { "200_db": 13.68, "150_db": 16.4, straight_line: 20 },
    janToSept: { "200_db": 11.52, "150_db": 16.66, straight_line: 20 },
  },
  2021: {
    octToDec: { "200_db": 10.94, "150_db": 16.41, straight_line: 20 },
    janToSept: { "200_db": 11.52, "150_db": 16.66, straight_line: 20 },
  },
  2020: {
    octToDec: { "200_db": 9.58, "150_db": 14.35, straight_line: 17.5 },
    janToSept: { "200_db": 5.76, "150_db": 8.33, straight_line: 10 },
  },
};

/* Line 33's method names, as the instructions' example writes them ("200 DB 20%", line-33::b01). */
const METHOD_TEXT: Readonly<Record<Form2106VehicleDepreciation["method"], string>> = {
  "200_db": "200 DB",
  "150_db": "150 DB",
  straight_line: "SL",
};

/*
 * Line 34, a vehicle placed in service October–December and sold in 2025: the
 * percentage for the quarter of disposal (Jan.–March 12.5%, April–June 37.5%,
 * July–Sept. 62.5%, Oct.–Dec. 87.5%; irs-2106-inst-2025 "Month of Disposal
 * Percentage", after ::line-34::b01).
 */
const DISPOSAL_QUARTER_RATE = [0.125, 0.375, 0.625, 0.875] as const;
/* The quarter (0–3) of each month, January first. */
const QUARTER_OF_MONTH = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3] as const;
/* Line 34, a vehicle placed in service January–September after 2019 and sold: 50% (line-34::b01). */
const HALF_YEAR_DISPOSAL_RATE = 0.5;

export interface SectionDInputs {
  depreciation: Form2106VehicleDepreciation;
  /* Line 11, YYYY-MM-DD. */
  placedInService: string;
  /* Line 14 as a ratio. */
  businessUse: number;
  /* The owner's W-2 box 1 wages: the section 179 income limit (line-31::b02). */
  ownerWages: number;
}

export interface SectionDLines {
  line30: number;
  line31: number;
  line32: number;
  line33: string;
  line34: number;
  line35: number;
  line36?: number;
  line37?: number;
  line38: number;
}

const yearOf = (date: string) => Number(date.slice(0, 4));
const monthOf = (date: string) => Number(date.slice(5, 7));

/* The special allowance applies: a 2025 car over 50% business use that claims it (line-31::b04). */
function specialAllowanceRate(inputs: SectionDInputs): number | string | undefined {
  const { depreciation, businessUse } = inputs;
  // "The special depreciation allowance applies only for the first year a vehicle is placed in service" (line-31::b04).
  if (yearOf(inputs.placedInService) !== TAX_YEAR || businessUse <= MORE_THAN_HALF)
    return undefined;
  const choice = depreciation.specialAllowance;
  if (choice === undefined) {
    return "A 2025 vehicle does not say whether it takes the special depreciation allowance.";
  }
  if (choice === "elected_out" || choice === "not_qualified") return undefined;
  if (choice === "elected_40_percent") return REDUCED_SPECIAL_ALLOWANCE_RATE;
  if (!depreciation.acquiredDate) {
    return "A 2025 vehicle that takes the special allowance does not state its acquisition date (100% or 40%).";
  }
  return depreciation.acquiredDate >= FULL_RATE_ACQUIRED_FROM
    ? FULL_SPECIAL_ALLOWANCE_RATE
    : REDUCED_SPECIAL_ALLOWANCE_RATE;
}

/* Line 36: the limit for the year, or undefined for a vehicle the limits do not cover. */
export function applicableLimit(
  placedYear: number,
  takesSpecialAllowance: boolean,
  subjectToLimits: boolean,
): number | undefined {
  if (!subjectToLimits) return undefined;
  if (placedYear === TAX_YEAR) {
    return takesSpecialAllowance
      ? FIRST_YEAR_LIMIT_WITH_SPECIAL_ALLOWANCE
      : FIRST_YEAR_LIMIT_WITHOUT_SPECIAL_ALLOWANCE;
  }
  return LIMIT_IN_2025_BY_YEAR_PLACED[placedYear];
}

/*
 * Section 179 (irs-2106-inst-2025::sec::line-31::b02, b03): "multiply the part of
 * the cost of the vehicle that you choose to expense by the percentage on line
 * 14", the cost first held to the line 36 limit (the published example: the
 * smaller of $25,000 and $20,200, × 0.75 = $15,150) and, for a heavy SUV, to
 * $31,300. Only a 2025 car over 50% business use.
 */
export function section179Deduction(
  depreciation: Form2106VehicleDepreciation,
  businessUse: number,
  limit: number | undefined,
): number {
  if (businessUse <= MORE_THAN_HALF) return 0;
  let cost = Math.min(atLeast(0, depreciation.section179Cost), depreciation.basis);
  if (depreciation.heavySportUtilityVehicle)
    cost = Math.min(cost, HEAVY_SUV_SECTION_179_COST_LIMIT);
  if (limit !== undefined) cost = Math.min(cost, limit);
  return roundDollars(cost * businessUse);
}

/*
 * The Worksheet for the Special Depreciation Allowance
 * (irs-2106-inst-2025::sec::worksheet-for-the-special-depreciation-allowance::b01):
 * line 7 is the smaller of the basis left (line 4) and the limit left (line 6),
 * plus section 179: Form 2106 line 31. At the 40% rate the basis left is taken
 * at 40% (QUESTIONS.md).
 */
export function specialAllowanceWorksheet(opts: {
  basis: number;
  businessUse: number;
  section179: number;
  limit: number | undefined;
  rate: number;
}): number {
  const line2 = roundDollars(opts.basis * opts.businessUse);
  const line4 = line2 - opts.section179;
  const line5 =
    opts.limit === undefined
      ? Number.POSITIVE_INFINITY
      : roundDollars(opts.limit * opts.businessUse);
  const line6 = line5 - opts.section179;
  const line7 = atLeast(0, Math.min(roundDollars(line4 * opts.rate), line6));
  return line7 + opts.section179;
}

/* Line 33: the chart's method and rate for the placed-in-service date, or why it cannot be read. */
export function chartRate(
  depreciation: Form2106VehicleDepreciation,
  placedInService: string,
  businessUse: number,
): { method: Form2106VehicleDepreciation["method"]; percent: number } | string {
  const year = yearOf(placedInService);
  const row = CHART[year];
  if (depreciation.standardMileageInFirstYear) {
    return "The vehicle used the standard mileage rate in its first year: straight line over its estimated useful life (irs-2106-inst-2025::sec::line-33::b01), which the chart does not give.";
  }
  if (!row) {
    return "A vehicle placed in service before 2020 is past the chart (irs-2106-inst-2025::sec::depreciation-method-and-percentage-chart-line-33::b01); its unrecovered basis rules are in Pub. 463.";
  }
  let method = depreciation.method;
  if (businessUse <= MORE_THAN_HALF && method !== "straight_line") {
    if (year !== TAX_YEAR) {
      return "Business use fell to 50% or less on a vehicle depreciated by declining balance: straight line from now on and recapture on Form 4797 (irs-2106-inst-2025::sec::line-33::b02), which the engine does not figure.";
    }
    // "You must use column (c) if the business use percentage on line 14 is 50% or less" (line-33::b02).
    method = "straight_line";
  }
  const half =
    monthOf(placedInService) >= FIRST_MONTH_OF_LAST_QUARTER ? row.octToDec : row.janToSept;
  return { method, percent: half[method] };
}

/* Line 33 as printed: "200 DB 20%". */
export function line33Text(method: Form2106VehicleDepreciation["method"], percent: number): string {
  return `${METHOD_TEXT[method]} ${percent}%`;
}

/* Line 34's share for a vehicle sold in 2025 (irs-2106-inst-2025::sec::line-34::b01), or a gap. */
function disposalShare(
  depreciation: Form2106VehicleDepreciation,
  placedInService: string,
): number | string {
  const month = depreciation.disposedMonth;
  if (month === undefined) return 1;
  if (yearOf(placedInService) === TAX_YEAR) {
    return "A vehicle placed in service and sold in 2025 has no depreciation (irs-pub-463-2025::sec::depreciation-deduction::b02); the engine does not figure the section 179 and allowance recapture.";
  }
  if (monthOf(placedInService) < FIRST_MONTH_OF_LAST_QUARTER) return HALF_YEAR_DISPOSAL_RATE;
  const quarter = QUARTER_OF_MONTH[month - 1];
  return quarter === undefined ? 1 : DISPOSAL_QUARTER_RATE[quarter];
}

/* Lines 31 and the limit: the 2025 deductions. A car placed in service earlier claims neither. */
function firstYearDeductions(
  inputs: SectionDInputs,
  limit: number | undefined,
  rate?: number,
): { line31?: number; gap?: string } {
  const { depreciation, businessUse } = inputs;
  if (yearOf(inputs.placedInService) !== TAX_YEAR) return { line31: 0 };
  const section179 = section179Deduction(depreciation, businessUse, limit);
  if (section179 > inputs.ownerWages) {
    return {
      gap: "The section 179 deduction is more than the owner's wages: it cannot be more than the income from the job and any other active business (irs-2106-inst-2025::sec::line-31::b02), which the engine does not figure.",
    };
  }
  if (rate === undefined) return { line31: section179 };
  return {
    line31: specialAllowanceWorksheet({
      basis: depreciation.basis,
      businessUse,
      section179,
      limit,
      rate,
    }),
  };
}

/*
 * Lines 30–38 for one vehicle. Line 32: line 30 × line 14, less the section 179
 * deduction and special allowance of this year and earlier years (line-32::b01).
 * Line 38: the smaller of lines 35 and 37; line 35 when the limits do not apply
 * (line-36::b01).
 */
export function sectionDLines(inputs: SectionDInputs): SectionDLines | string {
  const { depreciation, businessUse, placedInService } = inputs;
  const rate = specialAllowanceRate(inputs);
  if (typeof rate === "string") return rate;
  const subject = depreciation.subjectToPassengerAutomobileLimits;
  const limit = applicableLimit(yearOf(placedInService), rate !== undefined, subject);
  const first = firstYearDeductions(inputs, limit, rate);
  if (first.gap !== undefined) return first.gap;
  const chart = chartRate(depreciation, placedInService, businessUse);
  if (typeof chart === "string") return chart;
  const share = disposalShare(depreciation, placedInService);
  if (typeof share === "string") return share;
  const line31 = first.line31 ?? 0;
  const line32 = atLeast(
    0,
    roundDollars(depreciation.basis * businessUse) -
      line31 -
      atLeast(0, depreciation.priorSection179AndSpecialAllowance),
  );
  const line34 = roundDollars(((line32 * chart.percent) / PERCENT) * share);
  const line35 = line31 + line34;
  const line37 = limit === undefined ? undefined : roundDollars(limit * businessUse);
  return {
    line30: roundDollars(depreciation.basis),
    line31,
    line32,
    line33: line33Text(chart.method, chart.percent),
    line34,
    line35,
    line36: limit,
    line37,
    line38: line37 === undefined ? line35 : Math.min(line35, line37),
  };
}
