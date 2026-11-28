/*
 * Form 8900 (Rev. December 2023): pure arithmetic. Dollar lines round once to
 * the nearest dollar (the 1040 rule); the miles of lines 3a to 3d keep two
 * decimals (QUESTIONS.md item 2).
 */

import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/*
 * Line 2: "Enter 40% (0.40) of line 1" (irs-8900-face-2025::sec::face-page-1::b01);
 * "For tax years beginning after 2022, the credit rate on line 2 of Form 8900
 * was reduced from 50% to 40%" (irs-8900-inst-2025::sec::what-s-new::b01).
 */
export const CREDIT_RATE = 0.4;

/* Line 4: "Multiply line 3d by $3,500" (irs-8900-face-2025::sec::face-page-1::b01). */
export const LIMIT_PER_MILE = 3500;

/* Miles keep two decimals (QUESTIONS.md item 2). */
export const MILES_PLACES = 2;

export interface TrackMiles {
  /* Line 3a; blank for a business that is not a Class II or Class III railroad. */
  ownedOrLeased?: number;
  /* Line 3b; blank with no assignment. */
  assignedToOthers?: number;
  /* Line 3c; blank with no assignment to the business. */
  assignedToYou?: number;
}

/* Lines 1 to 5, whole dollars and miles. */
export interface TrackLines {
  line1: number;
  line2: number;
  line3a?: number;
  line3b?: number;
  line3c?: number;
  line3d: number;
  line4: number;
  line5: number;
}

/* Line 1: "Qualified railroad track maintenance expenditures paid or incurred", with cents while adding, rounded once. */
export const line1Of = (expenditures: number): number => roundDollars(expenditures);

/* Line 2: 40% of line 1. */
export const line2Of = (line1: number): number => roundDollars(line1 * CREDIT_RATE);

/* Miles as entered: two decimals, blank when not stated. */
export const milesOf = (miles: number | undefined): number | undefined =>
  miles === undefined ? undefined : roundToPlaces(miles, MILES_PLACES);

/*
 * Line 3d: "Total. Combine lines 3a through 3c" (face-page-1::b01). Line 3b
 * is printed in parentheses ("Less:"), so it subtracts. Never below 0: an
 * assignor "can only assign each mile of railroad track once"
 * (irs-8900-inst-2025::sec::line-3b::b01).
 */
export function line3dOf(miles: TrackMiles): number {
  const total = sum(miles.ownedOrLeased) - sum(miles.assignedToOthers) + sum(miles.assignedToYou);
  return atLeast(0, roundToPlaces(total, MILES_PLACES));
}

/* Line 4: line 3d times $3,500. */
export const line4Of = (line3d: number): number => roundDollars(line3d * LIMIT_PER_MILE);

/* Line 5: "Enter the smaller of line 2 or line 4" (face-page-1::b01). */
export const smallerOf = (first: number, second: number): number =>
  first < second ? first : second;

/* Line 7: "Add lines 5 and 6" (irs-8900-face-2025::sec::face-page-1::b02). */
export const line7Of = (line5: number | undefined, line6: number | undefined): number =>
  sum(line5, line6);

/*
 * Lines 1 to 5. A member of a controlled group or a group under common
 * control enters its share of the group's credit on line 5
 * (irs-8900-inst-2025::sec::member-of-controlled-group-or::b01); lines 1 to
 * 4 stay its own figures (QUESTIONS.md item 4).
 */
export function trackLines(
  expenditures: number,
  miles: TrackMiles,
  groupShareOfCredit?: number,
): TrackLines {
  const line1 = line1Of(expenditures);
  const line2 = line2Of(line1);
  const line3a = milesOf(miles.ownedOrLeased);
  const line3b = milesOf(miles.assignedToOthers);
  const line3c = milesOf(miles.assignedToYou);
  const line3d = line3dOf({
    ownedOrLeased: line3a,
    assignedToOthers: line3b,
    assignedToYou: line3c,
  });
  const line4 = line4Of(line3d);
  const line5 =
    groupShareOfCredit === undefined ? smallerOf(line2, line4) : roundDollars(groupShareOfCredit);
  return { line1, line2, line3a, line3b, line3c, line3d, line4, line5 };
}

/*
 * The basis reduction: "Use the amount of RTMC to reduce the basis of a
 * qualifying railroad structure (including railroad track) asset or
 * intangible asset, if applicable. The reduction is limited to the amount of
 * QRTME capitalized for the asset" (irs-8900-inst-2025::sec::adjustments-to-basis::b01).
 * The credit is line 5, the taxpayer's own: the entity reduces the basis for
 * a K-1 credit (line 6). The regulation names that amount: "the RTMC allowable
 * (as determined under paragraph (c) of this section)", lines 1 to 5
 * (cfr-26-2025::sec::s1.45g-1::e-2), and its Example 1 takes the whole credit
 * off the capitalized amount although most of the expenditures are deducted
 * (cfr-26-2025::sec::s1.45g-1::e-3-ex1-p2). Section 45G(e)(3) reads "the
 * credit so allowed" (QUESTIONS.md, "Two texts conflict", B).
 */
export const basisReductionOf = (line5: number, capitalized: number): number =>
  smallerOf(line5, roundDollars(capitalized));
