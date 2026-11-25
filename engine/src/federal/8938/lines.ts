/*
 * Form 8938 arithmetic: the reporting thresholds, the value of each asset in
 * U.S. dollars, the must-file test, and the line 32 value ranges. Pure
 * functions: the resolver reads the facts and passes plain numbers in.
 */

import type { ForeignAddress, ForeignAssetOwner } from "../../facts/index.js";
import { atLeast, roundDollars, sum, type UnitsPerDollar } from "../../money.js";

export interface ReportingThreshold {
  /* "more than $X on the last day of the tax year" */
  lastDay: number;
  /* "more than $Y at any time during the tax year" */
  anyTime: number;
}

/*
 * Specified individuals (irs-8938-inst-2025::sec::types-of-reporting-thresholds::b01,
 * b02, b03). An unmarried taxpayer and a married taxpayer filing a separate
 * return have the same amounts.
 */
export const THRESHOLD_IN_US: ReportingThreshold = { lastDay: 50000, anyTime: 75000 };
export const THRESHOLD_IN_US_JOINT: ReportingThreshold = { lastDay: 100000, anyTime: 150000 };
export const THRESHOLD_ABROAD: ReportingThreshold = { lastDay: 200000, anyTime: 300000 };
export const THRESHOLD_ABROAD_JOINT: ReportingThreshold = { lastDay: 400000, anyTime: 600000 };

export function reportingThreshold(jointReturn: boolean, livesAbroad: boolean): ReportingThreshold {
  if (livesAbroad) return jointReturn ? THRESHOLD_ABROAD_JOINT : THRESHOLD_ABROAD;
  return jointReturn ? THRESHOLD_IN_US_JOINT : THRESHOLD_IN_US;
}

/*
 * The value in U.S. dollars, cents kept: the amount in the foreign currency
 * divided by the rate (units of the currency per dollar) on the last day of
 * the tax year (foreign-currency-conversion::b01, currency-determination-date::b01).
 * A value below zero is zero (asset-with-no-positive-value::b01).
 */
export function dollarsOf(amount: number, rate?: UnitsPerDollar): number {
  const dollars = rate === undefined ? amount : amount / rate;
  return atLeast(0, dollars);
}

/*
 * The part of an asset's value that counts toward this return's threshold
 * (joint-interest-valuation::b01, b02):
 * - a joint return counts every asset of either spouse once, in full;
 * - a separate return counts one-half of an asset owned with a spouse who is a
 *   specified individual, and all of it when the spouse is not one;
 * - an asset owned with someone other than a spouse counts in full;
 * - a spouse's own asset is not on a separate return.
 * Undefined: the share waits for whether the spouse is a specified individual.
 */
export function thresholdShare(
  owner: ForeignAssetOwner,
  jointReturn: boolean,
  spouseIsSpecifiedIndividual: boolean | undefined,
): number | undefined {
  if (jointReturn) return 1;
  if (owner === "spouse") return 0;
  if (owner !== "joint_with_spouse") return 1;
  if (spouseIsSpecifiedIndividual === undefined) return undefined;
  return spouseIsSpecifiedIndividual ? 0.5 : 1;
}

/* One asset for the threshold test: its dollar values and its share. */
export interface ThresholdAsset {
  share: number;
  maximumDollars: number;
  yearEndDollars: number;
}

export interface ThresholdTotals {
  yearEnd: number;
  /* Each asset's highest value, added: the total at any one time is never more. */
  sumOfMaximums: number;
  /* The highest value of any one asset: the total at that time is never less. */
  largestMaximum: number;
}

export function thresholdTotals(assets: ReadonlyArray<ThresholdAsset>): ThresholdTotals {
  const maximums = assets.map((asset) => asset.share * asset.maximumDollars);
  return {
    yearEnd: sum(...assets.map((asset) => asset.share * asset.yearEndDollars)),
    sumOfMaximums: sum(...maximums),
    largestMaximum: Math.max(0, ...maximums),
  };
}

export type ThresholdOutcome = "files" | "does_not_file" | "needs_highest_total";

/*
 * "You satisfy the reporting threshold only if the total value of your
 * specified foreign financial assets is more than $X on the last day of the
 * tax year or more than $Y at any time during the tax year" (types-of-reporting-thresholds::b01).
 * The facts hold each asset's highest value, not the total on each day. The
 * total at any one time lies between the largest single value and the sum of
 * the highest values; only between them is the stated highest total asked.
 */
export function thresholdOutcome(
  totals: ThresholdTotals,
  threshold: ReportingThreshold,
  highestTotalValue?: number,
): ThresholdOutcome {
  if (totals.yearEnd > threshold.lastDay) return "files";
  if (highestTotalValue !== undefined) {
    return highestTotalValue > threshold.anyTime ? "files" : "does_not_file";
  }
  if (totals.largestMaximum > threshold.anyTime) return "files";
  if (totals.sumOfMaximums <= threshold.anyTime) return "does_not_file";
  return "needs_highest_total";
}

/* Line 32's printed ranges: a box for each, and line 32e for a value above the last. */
export const VALUE_RANGE_TOPS = [50000, 100000, 150000, 200000] as const;
export type ValueRange = "a" | "b" | "c" | "d" | "e";
const RANGE_BOXES: ValueRange[] = ["a", "b", "c", "d"];

/* "Check the box for the value range that represents the maximum value ... If the maximum value is more than $200,000, enter the maximum value on line 32e" (line-32::b01). */
export function valueRangeOf(maximumValue: number): ValueRange {
  const index = VALUE_RANGE_TOPS.findIndex((top) => maximumValue <= top);
  return index === -1 ? "e" : RANGE_BOXES[index];
}

/* The maximum value printed on line 23 or 32: whole dollars, the nearest dollar. */
export function printedMaximum(amount: number, rate?: UnitsPerDollar): number {
  return roundDollars(dollarsOf(amount, rate));
}

/* A GIIN is 19 characters: 6, 5, 2 and 3 characters with dots between (the four boxes of lines 26b and 35b). */
const GIIN_SEGMENT_LENGTHS = [6, 5, 2, 3];

export function giinSegments(giin: string): string[] | undefined {
  const segments = giin.trim().split(".");
  const fits =
    segments.length === GIIN_SEGMENT_LENGTHS.length &&
    segments.every((segment, index) => segment.length === GIIN_SEGMENT_LENGTHS[index]);
  return fits ? segments : undefined;
}

/* Lines 28, 35e and 36e: "City or town, state or province, country, and ZIP or foreign postal code". */
export function cityLine(address: ForeignAddress): string {
  const place = [address.city, address.stateOrProvince, address.country]
    .filter((part) => part !== undefined && part !== "")
    .join(", ");
  return address.postalCode ? `${place} ${address.postalCode}` : place;
}
