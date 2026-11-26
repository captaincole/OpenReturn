/*
 * Form 4563's arithmetic and the shares other forms take from it. Pure
 * functions: no facts read, no fields read.
 */

import { isoDayOf } from "../../currency/rates.js";
import type {
  AmericanSamoaExclusionFactValue,
  AmericanSamoaExclusionOwner,
  AmericanSamoaNetIncome,
} from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";
import { daysFromThrough } from "../2555/dates.js";
import { MIN_NET_EARNINGS, netEarnings } from "../schedule-se/lines.js";

/*
 * Part I line 6: the day of leaving and the day of return are days in American
 * Samoa. Pub. 570, chapter 1, Days of Presence: "Any day you are physically
 * present in that territory at any time during the day" (QUESTIONS.md).
 */
const TRAVEL_DAYS_PRESENT = 2;
/* The tax year, as ISO days. */
const YEAR_START = "2025-01-01";
const YEAR_END = "2025-12-31";
const DAY_BEFORE_YEAR = "2024-12-31";
const DAY_AFTER_YEAR = "2026-01-01";

/* Lines 7 to 15, whole dollars: each line is rounded, line 15 adds the rounded lines. */
export interface Form4563Lines {
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12?: number;
  line13?: number;
  line14?: number;
  line15: number;
}

/* One person's Form 4563. */
export interface Form4563Filer {
  key: string;
  owner: AmericanSamoaExclusionOwner;
  answers: AmericanSamoaExclusionFactValue;
  lines: Form4563Lines;
  /* The gross income of the excluded income, whole dollars (excludedGrossIncome). */
  excludedGrossIncome: number;
}

const netOf = (part: AmericanSamoaNetIncome | undefined) => roundDollars(part?.amount);

/*
 * Lines 7 to 14 (irs-4563-form-2025::sec::face-part-ii::b01), each the stated
 * qualifying income rounded to whole dollars; line 14 adds every kind of other
 * income before it rounds. Line 15: "Add lines 7 through 14."
 */
export function form4563Lines(value: AmericanSamoaExclusionFactValue): Form4563Lines {
  const other = value.otherIncome ?? [];
  const parts = {
    line7: roundDollars(value.wages?.amount),
    line8: roundDollars(value.interest),
    line9: roundDollars(value.dividends),
    line10: netOf(value.business),
    line11: netOf(value.capitalGain),
    line12: netOf(value.rentalAndRoyalties),
    line13: netOf(value.farm),
    line14: roundDollars(sumOrBlank(...other.map((item) => item.amount))),
  };
  return { ...parts, line15: sum(...Object.values(parts)) };
}

/* Any line 7 to 14 with an amount other than 0: the person has income to exclude. */
export function hasExcludedIncome(lines: Form4563Lines): boolean {
  const parts = [
    lines.line7,
    lines.line8,
    lines.line9,
    lines.line10,
    lines.line11,
    lines.line12,
    lines.line13,
    lines.line14,
  ];
  return parts.some((part) => part !== undefined && part !== 0);
}

/*
 * The gross income of the excluded income, for the deduction fraction of
 * Pub. 570, chapter 4: wages, interest, dividends and other income as they
 * are, and the gross income of lines 10 to 13 (facts/kinds/americanSamoaExclusion.ts).
 * Each part is the whole-dollar amount of its line, as the U.S. side takes
 * Form 1040's lines: the fraction is arithmetic on amounts already rounded
 * (QUESTIONS.md, item 16).
 */
export function excludedGrossIncome(value: AmericanSamoaExclusionFactValue): number {
  const otherGross = (value.otherIncome ?? []).map((item) => atLeast(0, item.amount));
  return sum(
    roundDollars(value.wages?.amount),
    roundDollars(value.interest),
    roundDollars(value.dividends),
    roundDollars(value.business?.grossIncome),
    roundDollars(value.capitalGain?.grossIncome),
    roundDollars(value.rentalAndRoyalties?.grossIncome),
    roundDollars(value.farm?.grossIncome),
    roundDollars(sumOrBlank(...otherGross)),
  );
}

/*
 * Pub. 570, chapter 4, Standard Deduction: "multiply your full standard
 * deduction by the following fraction: Gross income subject to U.S. income
 * tax / Gross income from all sources (including excluded territory income)".
 * The same fraction allocates every deduction that is not definitely related
 * to one kind of income (Figuring the deduction). With no excluded gross
 * income the fraction is 1. Rounded to the nearest dollar.
 */
export function allowableShare(
  deduction: number,
  usGrossIncome: number,
  excludedGross: number,
): number {
  const allSources = atLeast(0, usGrossIncome) + excludedGross;
  if (excludedGross <= 0 || allSources <= 0) return deduction;
  return roundDollars((deduction * atLeast(0, usGrossIncome)) / allSources);
}

/*
 * Line 6 column (c): the full days away "during the tax year" (the form),
 * between the day the person left and the day of return. A trip that starts
 * in 2024 or ends in 2026 counts only its days in 2025. Undefined when a date
 * is not "MM/DD/YYYY".
 */
export function daysAbsent(left: string, returned: string): number | undefined {
  const from = isoDayOf(left);
  const through = isoDayOf(returned);
  if (from === undefined || through === undefined) return undefined;
  const away = atLeast(0, daysFromThrough(from, through) - TRAVEL_DAYS_PRESENT);
  if (away === 0) return 0;
  const before = from < YEAR_START ? daysFromThrough(from, DAY_BEFORE_YEAR) - 1 : 0;
  const after = through > YEAR_END ? daysFromThrough(DAY_AFTER_YEAR, through) - 1 : 0;
  return atLeast(0, away - before - after);
}

/* Lines 10 and 13: the self-employment income a person excludes (net, before 92.35%). */
export const excludedSelfEmployment = (lines: Form4563Lines): number =>
  sum(lines.line10, lines.line13);

/*
 * "If you were self-employed and your net earnings from self-employment were
 * $400 or more, you will generally have to pay self-employment tax on those
 * earnings even though you can exclude the earnings" (irs-4563-form-2025::sec::filing-form-1040-or-1040-sr::b02).
 */
export const owesSelfEmploymentTax = (selfEmployment: number): boolean =>
  netEarnings(selfEmployment) >= MIN_NET_EARNINGS;
