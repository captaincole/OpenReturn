/*
 * Form 8912 arithmetic: the credit allowance percentage of line 18 column (e),
 * the rows of line 18, lines 19 and 20, Part I and Part II. Pure functions of
 * plain numbers and YYYY-MM-DD dates; resolveInfo.ts and credit.ts feed them.
 */

import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/*
 * Column (e): "Generally, enter 25% for each credit allowance date you hold a
 * CREB, or qualified tax credit bond during your tax year. Enter 100% for a
 * BAB, or a QZAB issued before October 4, 2008"
 * (irs-8912-inst-2025::sec::line-18-column-a::b02).
 */
export const PERCENT_PER_ALLOWANCE_DATE = 25;
export const FULL_YEAR_PERCENT = 100;

/* Column (c): "The credit rate for a BAB is 35%" (irs-8912-inst-2025::sec::line-18-column-a::b01). */
export const BUILD_AMERICA_BOND_CREDIT_RATE = 0.35;

/* Line 20: a new CREB or a QECB takes 70% of line 19 (irs-8912-face-2025::sec::face-part-iv::b02). */
export const NEW_BOND_CREDIT_SHARE = 0.7;

/* "The credit is not available for bonds issued after December 31, 2017" (irs-8912-inst-2025::sec::future-developments::b01). */
export const LAST_ISSUE_DATE = "2017-12-31";

/* A QZAB issued before October 4, 2008 follows section 1397E (who-can-claim-the-credits::b01). */
export const FIRST_QUALIFIED_QZAB_DATE = "2008-10-04";

/* Rows on the printed form: Part III line 13 has 20, Part IV line 18 has 18. */
export const PART_III_ROWS = 20;
export const PART_IV_ROWS = 18;

/*
 * Example 2 rounds the prorated fraction to 3 places and the percentage to a
 * whole number: "38 days ... / 92 days ... = 0.413 x 25% (0.25) = 10%"
 * (irs-8912-inst-2025::sec::line-18-column-a::b03; QUESTIONS.md).
 */
const FRACTION_PLACES = 3;
const PERCENT_PLACES = 0;

/*
 * The credit allowance dates of one tax year: "March 15, June 15, September
 * 15, and December 15", and "the last day on which the qualified tax credit
 * bond is outstanding" (irs-8912-inst-2025::sec::who-can-claim-the-credits::b01).
 * `previous` is the last regular date before the year and `next` the first
 * after it, so the 3-month period around each date is known.
 */
export interface AllowanceCalendar {
  previous: string;
  dates: readonly string[];
  next: string;
  yearEnd: string;
}

export const CALENDAR_2025: AllowanceCalendar = {
  previous: "2024-12-15",
  dates: ["2025-03-15", "2025-06-15", "2025-09-15", "2025-12-15"],
  next: "2026-03-15",
  yearEnd: "2025-12-31",
};

/*
 * When the holder held the bond. `acquired` is the day bought, counted as held
 * (Example 1: "including the day the bond was purchased as the first day").
 * `sold` is the day the holder sold it: the buyer holds it from that day.
 * `ended` is the day the bond stopped being outstanding: its maturity or a
 * redemption.
 */
export interface Holding {
  issued?: string;
  acquired?: string;
  sold?: string;
  ended?: string;
}

/* One credit allowance date the holder claims, and its percentage. */
export interface AllowanceShare {
  date: string;
  percent: number;
}

const MS_PER_DAY = 86_400_000;

/* Whole days from one YYYY-MM-DD date to a later one: the days after `from` through `to`. */
export function daysAfter(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY;
}

/*
 * The prorated percentage of a 3-month period from `previous` to `next` in
 * which the bond was outstanding only from the day after `start` through
 * `until`: "(a) the number of days the bond was outstanding beginning on the
 * day after the last credit allowance date and ending on the maturity date by
 * (b) the number of days included in the 3-month period"
 * (irs-8912-inst-2025::sec::line-18-column-a::b03). For a bond issued in the
 * period, (a) starts the day after the issue date (2011 instructions example,
 * evidence.md).
 */
export function proratedPercent(
  previous: string,
  start: string,
  until: string,
  next: string,
): number {
  const fraction = roundToPlaces(
    daysAfter(start, until) / daysAfter(previous, next),
    FRACTION_PLACES,
  );
  return roundToPlaces(fraction * PERCENT_PER_ALLOWANCE_DATE, PERCENT_PLACES);
}

const heldOn = (date: string, holding: Holding) =>
  (holding.acquired === undefined || holding.acquired <= date) &&
  (holding.sold === undefined || holding.sold > date);

/*
 * The credit allowance dates of the year on which the holder held the bond:
 * 25% for each, prorated for the period in which the bond was issued, matured
 * or was redeemed ("the 25% will be prorated if a CREB or qualified tax credit
 * bond is issued, redeemed, or matures during the 3-month period",
 * line-18-column-a::b02). No bond issued in 2025 has a credit (after 2017).
 */
export function allowanceShares(calendar: AllowanceCalendar, holding: Holding): AllowanceShare[] {
  const shares: AllowanceShare[] = [];
  const { issued, ended } = holding;
  let previous = calendar.previous;
  for (const date of [...calendar.dates, calendar.next]) {
    if (ended !== undefined && ended <= previous) break;
    if (issued !== undefined && issued >= date) {
      previous = date;
      continue;
    }
    const start = issued !== undefined && issued > previous ? issued : previous;
    const endsHere = ended !== undefined && ended < date;
    const until = endsHere ? (ended as string) : date;
    if (until <= calendar.yearEnd && heldOn(until, holding)) {
      const whole = start === previous && !endsHere;
      // Example 2 lists the share under the period's date ("September 15, 2018 ... 10").
      shares.push({
        date: date <= calendar.yearEnd ? date : until,
        percent: whole ? PERCENT_PER_ALLOWANCE_DATE : proratedPercent(previous, start, until, date),
      });
    }
    if (endsHere) break;
    previous = date;
  }
  return shares;
}

/* Column (e) of a row: the shares of the dates it covers (all of them when `dates` is absent). */
export function rowPercent(shares: readonly AllowanceShare[], dates?: readonly string[]): number {
  const covered =
    dates === undefined ? shares : shares.filter((share) => dates.includes(share.date));
  return sum(...covered.map((share) => share.percent));
}

export interface Line18Inputs {
  outstandingAmount: number;
  creditRate: number;
  percent: number;
}

export interface Line18Row {
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/*
 * One row of line 18: (d) "Multiply (b) x (c)", (f) "Multiply (d) x (e)"
 * (irs-8912-face-2025::sec::face-part-iv::b01). Each money column is whole
 * dollars, and (f) multiplies the rounded (d).
 */
export function line18Row(inputs: Line18Inputs): Line18Row {
  const columnB = roundDollars(inputs.outstandingAmount);
  const columnD = roundDollars(columnB * inputs.creditRate);
  const columnF = roundDollars((columnD * inputs.percent) / FULL_YEAR_PERCENT);
  return { b: columnB, c: inputs.creditRate, d: columnD, e: inputs.percent, f: columnF };
}

/* Line 19: "Add the amounts on line 18, column (f)". */
export function line19(columnF: readonly number[]): number {
  return sum(...columnF);
}

/*
 * Line 20: "For a new clean renewable energy bond or a qualified energy
 * conservation bond, multiply the amount on line 19 by 70% (0.70) ... For a
 * clean renewable energy bond, qualified zone academy bond, qualified school
 * construction bond, or build America bond, enter the amount from line 19"
 * (irs-8912-face-2025::sec::face-part-iv::b02). `takesSeventyPercent` is false
 * for a credit an entity passed through (QUESTIONS.md, rule decisions).
 */
export function line20(line19Amount: number, takesSeventyPercent: boolean): number {
  return takesSeventyPercent ? roundDollars(line19Amount * NEW_BOND_CREDIT_SHARE) : line19Amount;
}

/* Line 14 of one Part III: the column (c) amounts, cents kept until the total (a document sum). */
export function line14(columnC: readonly number[]): number {
  return roundDollars(sum(...columnC));
}

export interface PartILines {
  line1: number | undefined;
  line2: number | undefined;
  line3: number | undefined;
  line4: number;
}

/*
 * Part I: line 1 is every Part III line 14, line 2 every Part IV line 20,
 * line 3 the carryforward, line 4 "Add lines 1 through 3"
 * (irs-8912-inst-2025::sec::line-14::b01, ::line-20::b01, ::line-3::b01).
 */
export function partI(
  lines14: readonly number[],
  lines20: readonly number[],
  carryforward: number | undefined,
): PartILines {
  const line1 = lines14.length === 0 ? undefined : sum(...lines14);
  const line2 = lines20.length === 0 ? undefined : sum(...lines20);
  const line3 = roundDollars(carryforward);
  return { line1, line2, line3, line4: sum(line1, line2, line3) };
}

export interface CreditsBefore {
  line10a: number | undefined;
  line10b: number | undefined;
  line10c: number | undefined;
  line10d: number | undefined;
}

export interface PartIILines extends CreditsBefore {
  line7: number;
  line8: number | undefined;
  line9: number;
  line10e: number;
  line11: number;
}

/*
 * Lines 7 to 11: line 9 adds lines 7 and 8, line 10e adds lines 10a through
 * 10d, line 11 is line 9 less line 10e, never below 0 (QUESTIONS.md).
 */
export function partII(
  line7: number,
  line8: number | undefined,
  credits: CreditsBefore,
): PartIILines {
  const line9 = sum(line7, line8);
  const line10e = sum(credits.line10a, credits.line10b, credits.line10c, credits.line10d);
  return { line7, line8, line9, ...credits, line10e, line11: atLeast(0, line9 - line10e) };
}

/* One interest in a pass-through entity that passed a CREB credit on (line 12 formula). */
export interface PassThroughCreb {
  credit: number;
  attributableTaxableIncome: number;
}

/*
 * The formula of line 12: "Line 11 x Taxable income for the year attributable
 * to your interest in the pass-through entity / Taxable income for the year";
 * no taxable income from the interest, no credit
 * (irs-8912-inst-2025::sec::line-12::b02).
 */
export function passThroughLimit(
  line11: number,
  interest: PassThroughCreb,
  taxableIncome: number,
): number {
  if (taxableIncome <= 0 || interest.attributableTaxableIncome <= 0) return 0;
  return Math.min(
    interest.credit,
    roundDollars((line11 * interest.attributableTaxableIncome) / taxableIncome),
  );
}

/*
 * Line 12: the smallest of line 4, line 11 and the formula's amount. The
 * formula adds each pass-through CREB credit as limited "to the total credit on
 * line 4 not attributable to that pass-through entity", and line 12 is "the
 * smaller of this result or the amount on line 11"
 * (irs-8912-inst-2025::sec::line-12::b02, ::b03).
 */
export function line12(
  line4: number,
  line11: number,
  interests: readonly PassThroughCreb[],
  taxableIncome: number,
): number {
  const attributed = sum(...interests.map((interest) => interest.credit));
  const limited = sum(
    ...interests.map((interest) => passThroughLimit(line11, interest, taxableIncome)),
  );
  return Math.min(line4, line11, line4 - attributed + limited);
}
