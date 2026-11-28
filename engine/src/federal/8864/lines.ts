/*
 * Form 8864 (Rev. December 2025) arithmetic: the small agri-biodiesel producer
 * credit of lines 7 to 9 and the totals of lines 10 and 11. Pure functions of
 * gallons and dollars; figures.ts reads the facts.
 */

import { prorateDollars, roundDollars, sum, sumOrBlank } from "../../money.js";

/* Line 7 column (b): "$.10 per gallon from January 1, 2025, through June 30, 2025" (irs-8864-inst-2025::sec::line-7::b01). */
export const RATE_BEFORE_JULY = 0.1;
/* Line 8 column (b): "after June 30, 2025, but before January 1, 2027. The credit rate is $.20" (irs-8864-inst-2025::sec::line-8::b01). */
export const RATE_AFTER_JUNE = 0.2;
/* "Qualified agri-biodiesel production means up to 15 million gallons" (irs-8864-inst-2025::sec::qualified-agri-biodiesel-production::b01). */
export const QUALIFIED_PRODUCTION_LIMIT_GALLONS = 15_000_000;
/* "a productive capacity for agri-biodiesel not in excess of 60 million gallons" (qualified-agri-biodiesel-production::b02). */
export const PRODUCTIVE_CAPACITY_LIMIT_GALLONS = 60_000_000;

export interface OwnProductionLines {
  line7a: number;
  line7c: number;
  line8a: number;
  line8c: number;
  /* "Add lines 7 and 8. Include this amount in income for your tax year" (irs-8864-face-2025::sec::face-page-1::b01). */
  line9: number;
}

/* Column (c): "Column (a) x column (b)", in whole dollars (the form has no cents column). */
export const columnC = (gallons: number, rate: number): number => roundDollars(gallons * rate);

/* Lines 7 to 9 from the qualified gallons of each period, every business added. */
export function ownProductionLines(
  gallonsBeforeJuly: number,
  gallonsAfterJune: number,
): OwnProductionLines {
  const line7c = columnC(gallonsBeforeJuly, RATE_BEFORE_JULY);
  const line8c = columnC(gallonsAfterJune, RATE_AFTER_JUNE);
  return {
    line7a: gallonsBeforeJuly,
    line7c,
    line8a: gallonsAfterJune,
    line8c,
    line9: line7c + line8c,
  };
}

/* One business's credit before rounding: its share of line 9 is in proportion to it. */
export const unroundedCredit = (gallonsBeforeJuly: number, gallonsAfterJune: number): number =>
  gallonsBeforeJuly * RATE_BEFORE_JULY + gallonsAfterJune * RATE_AFTER_JUNE;

/*
 * Each business's whole-dollar part of line 9, in proportion to its own
 * credit, so the parts add to line 9 exactly: the part is the business's
 * Schedule C line 6 income and its Form 3800 line 1l source.
 */
export function line9Shares(line9: number, credits: readonly number[]): number[] {
  if (credits.length === 1) return [line9];
  return prorateDollars(line9, credits);
}

/*
 * The 15 million and 60 million gallon limits "are applied at both the entity
 * level and at the partner or similar level" (qualified-agri-biodiesel-production::b02),
 * and a partner is "subject to" both (irs-8864-inst-2025::sec::line-10::b01).
 * With one source, its own limits are the limits. With more than one, the
 * engine can confirm the limits only when the sums stay within them: then every
 * way of counting the sources agrees. True when they do.
 */
export function withinCombinedLimits(
  sources: ReadonlyArray<{ gallons: number; productiveCapacityGallons: number }>,
): boolean {
  if (sources.length < 2) return true;
  const gallons = sum(...sources.map((source) => source.gallons));
  const capacity = sum(...sources.map((source) => source.productiveCapacityGallons));
  return (
    gallons <= QUALIFIED_PRODUCTION_LIMIT_GALLONS && capacity <= PRODUCTIVE_CAPACITY_LIMIT_GALLONS
  );
}

/* Line 11: "Add lines 9 and 10"; blank while both are blank. */
export const line11Of = (
  line9: number | undefined,
  line10: number | undefined,
): number | undefined => sumOrBlank(line9, line10);

/*
 * Line 10 from each pass-through credit in whole dollars: each K-1 rounds
 * before the add, as Form 3800 Part V lists one whole-dollar amount for each
 * entity (the rule of Form 8846 line 5, docs/rule-decisions.md).
 */
export const line10Of = (credits: readonly number[]): number | undefined =>
  credits.length === 0 ? undefined : sum(...credits.map((credit) => roundDollars(credit)));
