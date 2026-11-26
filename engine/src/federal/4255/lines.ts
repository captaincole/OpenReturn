/*
 * Form 4255 Parts II and III and Worksheet 3: pure arithmetic. Block ids are in
 * irs-4255-inst-2025::sec unless named. Amounts are whole dollars.
 */

import type {
  CreditRecapturePropertyFactValue,
  EmissionsTierRecaptureFactValue,
  PrevailingWageRecaptureEntry,
} from "../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";

/* Line 15 table (line-15::b01): full years on line 12 → the recapture percentage. Five or more: 0. */
export const RECAPTURE_PERCENT_BY_FULL_YEARS = [100, 80, 60, 40, 20] as const;
/* "Enter 100 for certain expansions in connection with advanced manufacturing facilities" (line-15::b01). */
export const FULL_RECAPTURE_PERCENT = 100;
/* Part III line 9: "Multiply line 8 by 20% (0.20)" (the form; description-of-emissions-tier-recapture::b03). */
export const EMISSIONS_TIER_RECAPTURE_RATE = 0.2;
/* Worksheet 3 line 2: "Multiply line 1 by 0.80" (property-project-facility-or-technology::b01). */
export const PREVAILING_WAGE_INCREASED_SHARE = 0.8;
/* The 20% EP and the 20% of an excessive credit transfer (excessive-payment::b01, excessive-credit-transfer::b01). */
export const EXCESS_ADDITION_RATE = 0.2;

const PERCENT_PLACES = 2;

/* A decimal rate as the form prints a percentage: 0.2 → "20%", 0.075 → "7.5%". */
export const percentText = (rate: number): string =>
  `${roundToPlaces(rate * 100, PERCENT_PLACES)}%`;

/* Line 10: "using the first day of the month in which the property was placed in service" (line-10::b01). */
export const firstOfMonth = (isoDate: string): string => `${isoDate.slice(0, 7)}-01`;

/*
 * Full years from one date to another: "Don't enter partial years. If the
 * property was held less than 12 months, enter -0-" (line-12::b01).
 */
export function fullYearsBetween(startIso: string, endIso: string): number {
  const [startYear, startMonth, startDay] = startIso.split("-").map(Number);
  const [endYear, endMonth, endDay] = endIso.split("-").map(Number);
  const beforeAnniversary = endMonth < startMonth || (endMonth === startMonth && endDay < startDay);
  return atLeast(0, endYear - startYear - (beforeAnniversary ? 1 : 0));
}

export const recapturePercent = (fullYears: number): number =>
  RECAPTURE_PERCENT_BY_FULL_YEARS[fullYears] ?? 0;

export interface PropertyLines {
  description: string;
  line1: string;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8?: number;
  line9: number;
  /* Section D (lines 10–16): only for a property disposed of or that stopped qualifying. */
  sectionD?: {
    line10: string;
    line11: string;
    line12: number;
    line13: number;
    line14: number;
    /* The percentage, 0 to 100. */
    line15: number;
    line16: number;
    /* The property's unused credit less the recapture percentage of it (carryover-adjustment-on-recapture::b01). */
    carryoverReduction: number;
  };
  line17?: string;
}

/*
 * Section B (lines 1–6) and Section C (lines 7–9). Line 3 is -0- when section
 * 49(a)(1) does not apply (line-3::b01). Line 5 is line 1 × line 4, not more
 * than a dollar limit (line-5::b01). Line 7 is line 6 − line 5, at least 0.
 * Line 8 is Worksheet 1 (line-8::b01); with no Section C facts and line 7 at
 * 0, there is no excess credit, so it is 0. Undefined: line 7 is above 0 and
 * the property states no Section C amounts.
 */
function sectionsBAndC(property: CreditRecapturePropertyFactValue) {
  const line2 = roundDollars(property.creditBase);
  const line3 = roundDollars(property.nonrecourseFinancing?.netChange ?? 0);
  const line4 = line2 - line3;
  const refigured = roundDollars(property.originalRate * line4);
  const line5 =
    property.creditLimit === undefined
      ? refigured
      : Math.min(refigured, roundDollars(property.creditLimit));
  const line6 = roundDollars(property.creditTaken);
  const line7 = atLeast(0, line6 - line5);
  const stated = property.nonrecourseFinancing?.unusedCreditsWithCurrentBase;
  if (stated === undefined && line7 > 0) return undefined;
  const line8 = roundDollars(stated ?? 0);
  return { line2, line3, line4, line5, line6, line7, line8, line9: atLeast(0, line7 - line8) };
}

/*
 * Section D (lines 10–16; line-10::b01 to line-16::b01). Line 14 is line 6 −
 * line 13, at least 0: Worksheet 2 cannot give back more than line 6.
 */
function sectionD(
  line6: number,
  disposition: NonNullable<CreditRecapturePropertyFactValue["disposition"]>,
) {
  const line10 = firstOfMonth(disposition.placedInService);
  const line12 =
    disposition.zeroYearEvent === undefined ? fullYearsBetween(line10, disposition.ceased) : 0;
  const line15 =
    disposition.zeroYearEvent === "advanced_manufacturing_expansion"
      ? FULL_RECAPTURE_PERCENT
      : recapturePercent(line12);
  const line13 = roundDollars(disposition.unusedCreditsWithoutProperty);
  const line14 = atLeast(0, line6 - line13);
  return {
    line10,
    line11: disposition.ceased,
    line12,
    line13,
    line14,
    line15,
    line16: roundDollars((line14 * line15) / 100),
    carryoverReduction: roundDollars((roundDollars(disposition.unusedCredit) * line15) / 100),
  };
}

/* One property column of Part II, or undefined when line 8 has no amount to take. */
export function propertyLines(
  property: CreditRecapturePropertyFactValue,
): PropertyLines | undefined {
  const lines = sectionsBAndC(property);
  if (lines === undefined) return undefined;
  return {
    description: property.description,
    line1: percentText(property.originalRate),
    ...lines,
    sectionD: property.disposition && sectionD(lines.line6, property.disposition),
    line17: property.registrationNumber,
  };
}

/* Lines 18–20: line 9 and line 16 of every property; line 20 is "Total increase in tax". */
export function partTwoTotals(properties: ReadonlyArray<PropertyLines>) {
  const line18 = sum(...properties.map((property) => property.line9));
  const disposed = properties.filter((property) => property.sectionD !== undefined);
  const line19 =
    disposed.length === 0 ? undefined : sum(...disposed.map((each) => each.sectionD?.line16));
  return { line18, line19, line20: line18 + (line19 ?? 0) };
}

/* The increase in tax a property sends to Part I column (h): line 9 plus line 16. */
export const propertyIncreaseInTax = (property: PropertyLines): number =>
  property.line9 + (property.sectionD?.line16 ?? 0);

export interface PartThreeLines {
  line1: string;
  line2: number;
  line3: string;
  line4: number;
  line5: string;
  line6: string;
  line7: number;
  line8: number;
  line9: number;
}

/* "If you didn't obtain an annual verification report for the current tax year, enter -0-" (lines 5 and 6, the form). */
const NO_REPORT = "0";

/*
 * Part III (the form; description-of-emissions-tier-recapture::b03): line 4 =
 * line 2 × line 3, line 7 = line 6 × line 2, line 8 = line 4 − line 7 (at least
 * 0: a higher energy percentage is no recapture event), line 9 = 20% of line 8.
 */
export function partThreeLines(facility: EmissionsTierRecaptureFactValue): PartThreeLines {
  const line2 = roundDollars(facility.basis);
  const line4 = roundDollars(line2 * facility.energyPercentage);
  const report = facility.verificationReport;
  const line7 = roundDollars(line2 * (report?.energyPercentage ?? 0));
  const line8 = atLeast(0, line4 - line7);
  return {
    line1: facility.designedEmissionsRate,
    line2,
    line3: percentText(facility.energyPercentage),
    line4,
    line5: report?.emissionsRate ?? NO_REPORT,
    line6: report === undefined ? NO_REPORT : percentText(report.energyPercentage),
    line7,
    line8,
    line9: roundDollars(line8 * EMISSIONS_TIER_RECAPTURE_RATE),
  };
}

/*
 * Worksheet 3 for one property (worksheet-2::b07; property-project-facility-or-technology::b01):
 * line 2 = 80% of line 1, line 5 the full years from line 3 to line 4, line 6
 * the table, line 7 = line 2 × line 6. Line 3 is the date as stated: the
 * first-of-the-month rule is line 10's (QUESTIONS.md).
 */
export function prevailingWageRecapture(entry: PrevailingWageRecaptureEntry) {
  const line2 = roundDollars(roundDollars(entry.credit) * PREVAILING_WAGE_INCREASED_SHARE);
  const percent = recapturePercent(fullYearsBetween(entry.placedInService, entry.failedOn));
  return { percent, increaseInTax: roundDollars((line2 * percent) / 100) };
}
