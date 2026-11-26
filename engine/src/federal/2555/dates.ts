/*
 * Form 2555's dates: the qualifying period (lines 31 and 38) and the two
 * tests' time rules. Dates are "MM/DD/YYYY" (facts/kinds/foreignEarnedIncome.ts).
 */

import { isoDayOf } from "../../currency/rates.js";
import type { ForeignEarnedIncomeFactValue, PhysicalPresence } from "../../facts/index.js";
import { sum } from "../../money.js";

const DAY_MS = 86_400_000;
const YEAR_START = "2025-01-01";
const YEAR_END = "2025-12-31";
/* "at least 330 full days during any period of 12 months in a row" (irs-2555-inst-2025::sec::part-iii-taxpayers-qualifying-under::b01). */
export const PHYSICAL_PRESENCE_DAYS = 330;
const UNITED_STATES = ["united states", "u.s.", "us", "usa", "united states of america"];

const timeOf = (isoDay: string) => Date.parse(`${isoDay}T00:00:00Z`);
const later = (left: string, right: string) => (left > right ? left : right);
const earlier = (left: string, right: string) => (left < right ? left : right);

/* The days from `from` through `through`, both counted; 0 when `through` is before `from`. */
export function daysFromThrough(from: string, through: string): number {
  const days = (timeOf(through) - timeOf(from)) / DAY_MS + 1;
  return days > 0 ? days : 0;
}

/* The day a period of 12 months in a row ends, when it starts on `from`: one day before the same date a year later. */
function twelveMonthsEnd(from: string): string {
  const [year, month, day] = from.split("-");
  const nextYear = `${Number(year) + 1}-${month}-${day}`;
  return new Date(timeOf(nextYear) - DAY_MS).toISOString().slice(0, 10);
}

/*
 * Line 16: "The 12-month period on which the physical presence test is based
 * must include 365 days (366 days during a leap year), part of which must be
 * in 2025" (irs-2555-inst-2025::sec::line-16::b01).
 */
export function isTwelveMonthPeriod(presence: PhysicalPresence): boolean {
  const from = isoDayOf(presence.from);
  const through = isoDayOf(presence.through);
  if (from === undefined || through === undefined) return false;
  return twelveMonthsEnd(from) === through && from <= YEAR_END && through >= YEAR_START;
}

const isUnitedStates = (country: string) => UNITED_STATES.includes(country.trim().toLowerCase());

/*
 * The full days in foreign countries during the period: line 18 column (d) of
 * every stay outside the United States, or the whole period when no stay is
 * listed ("Physically present in a foreign country or countries for the entire
 * 12-month period", irs-2555-face-2025::sec::face-part-iii::b01).
 */
export function fullDaysAbroad(presence: PhysicalPresence): number {
  const stays = presence.stays ?? [];
  if (stays.length === 0) {
    const from = isoDayOf(presence.from);
    const through = isoDayOf(presence.through);
    return from && through ? daysFromThrough(from, through) : 0;
  }
  return sum(...stays.filter((stay) => !isUnitedStates(stay.country)).map((stay) => stay.fullDays));
}

/*
 * The bona fide residence test needs "an uninterrupted period that includes an
 * entire tax year" (irs-2555-inst-2025::sec::part-ii-taxpayers-qualifying-under::b01).
 * A residence that ended before covering a whole calendar year fails it; one
 * that "Continues" is taken as the taxpayer states it.
 */
export function coversWholeYear(began: string, ended: string | undefined): boolean {
  const start = isoDayOf(began);
  if (start === undefined) return false;
  if (ended === undefined) return true;
  const end = isoDayOf(ended);
  if (end === undefined) return false;
  const startYear = Number(start.slice(0, 4));
  const firstFullYear = start.slice(5) === "01-01" ? startYear : startYear + 1;
  return end >= `${firstFullYear}-12-31`;
}

/* The first tax home's date, as an ISO day; undefined when no tax home has one. */
function firstTaxHome(value: ForeignEarnedIncomeFactValue): string | undefined {
  const days = value.taxHomes
    .map((home) => isoDayOf(home.established))
    .filter((day): day is string => day !== undefined);
  return days.length === 0 ? undefined : days.reduce(earlier);
}

/* The test's period as ISO days; undefined when a date is not a calendar date. */
function testPeriod(
  value: ForeignEarnedIncomeFactValue,
): { from: string; through: string } | undefined {
  if (value.qualifyingPeriod) {
    const from = isoDayOf(value.qualifyingPeriod.from);
    const through = isoDayOf(value.qualifyingPeriod.through);
    return from && through ? { from, through } : undefined;
  }
  const residence = value.bonaFideResidence;
  const presence = value.physicalPresence;
  const from = isoDayOf(residence?.began ?? presence?.from);
  const through = residence
    ? residence.ended === undefined
      ? YEAR_END
      : isoDayOf(residence.ended)
    : isoDayOf(presence?.through);
  if (from === undefined || through === undefined) return undefined;
  const taxHome = firstTaxHome(value);
  return { from: taxHome ? later(from, taxHome) : from, through };
}

/*
 * Line 31: "the number of days in your qualifying period that fall within your
 * 2025 tax year. Your qualifying period is the period during which you meet
 * the tax home test and either the bona fide residence or physical presence
 * test" (irs-2555-inst-2025::sec::line-31::b01). The period starts no earlier
 * than the first tax home and is cut to 2025. Undefined: a date is not a date.
 */
export function qualifyingDays(value: ForeignEarnedIncomeFactValue): number | undefined {
  const period = testPeriod(value);
  if (period === undefined) return undefined;
  return daysFromThrough(later(period.from, YEAR_START), earlier(period.through, YEAR_END));
}
