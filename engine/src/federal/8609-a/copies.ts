/*
 * One Form 8609-A from one building fact: Part II as it prints, the first line
 * that is a gap, or the fact it waits on. Pure: no form reads, so Form 8586
 * and the form read the same copy.
 */

import type { LowIncomeHousingBuildingFactValue } from "../../facts/index.js";
import { creditYearLines, type Built } from "./creditYear.js";
import type { Form8609ACopy, Form8609APartII } from "./filingInfo.js";
import {
  additionsToQualifiedBasis,
  averagePortion,
  creditPercentage,
  deferredFirstYearCredit,
  lowIncomePortion,
  qualifiedBasis,
  tenThousandthsOf,
} from "./lines.js";
import { daysOwned, disposedIn2025, interestChangeIn2025, TAX_YEAR } from "./ownership.js";

/* The credit period is 10 years; the compliance period 15 (section 42(f)(1), 42(i)(1)). */
export const CREDIT_PERIOD_YEARS = 10;
export const COMPLIANCE_PERIOD_YEARS = 15;
const DEFERRED_CREDIT_YEAR = CREDIT_PERIOD_YEARS + 1;
const LINE_1 = 1;
const LINE_7 = 7;
const LINE_17 = 17;

export const AT_RISK =
  "The basis is limited by the at-risk rule of section 42(k) (irs-8609a-inst-2025::sec::line-3-2::b04); the instructions give no computation for it.";
export const ADDITIONS_AFTER_CREDIT_PERIOD =
  'An addition to qualified basis after the 10-year credit period: its credit is claimed "through the end of the 15-year compliance period" (irs-8609a-inst-2025::sec::line-7::b01), but line 13 (line 6 less line 12) always includes the credit on the whole qualified basis, and the instructions give no lines for the addition alone.';
export const DEFERRED_CREDIT_PART_OWNER =
  "Line 17 in the 11th year for an owner of part of the building, or for part of the year: the instructions give the deferred credit only for the whole building (irs-8609a-inst-2025::sec::line-17::b01).";

/* The year of the compliance period that 2025 is: the first credit year is year 1. */
export function yearOfCompliancePeriod(firstCreditYear: number): number {
  return TAX_YEAR - firstCreditYear + 1;
}

/* Lines 1 to 3, or undefined while the first year's month-end counts are missing. */
function basisLines(value: LowIncomeHousingBuildingFactValue, year: number) {
  const line1 = value.form8609.eligibleBasis;
  const months = value.firstYearMonthEnds;
  if (year === 1 && months === undefined) return undefined;
  const line2 =
    year === 1 && months !== undefined
      ? averagePortion(months.map(lowIncomePortion))
      : lowIncomePortion(value.yearEnd);
  const maximum = value.limitedToMaximumQualifiedBasis
    ? value.form8609.maximumQualifiedBasis
    : undefined;
  return { line1, line2, line3: qualifiedBasis(line1, line2, maximum) };
}

/*
 * "The qualified basis of the building (line 3) is zero" when the deep rent
 * skewed test is violated, or when the owner disposed of the building without
 * the procedures that prevent recapture (irs-8609a-inst-2025::sec::line-3-2::b01,
 * b03). A failed minimum set-aside, or a building out of compliance, is item D's
 * "No": Part II is not completed. Undefined: a disposition that does not say.
 */
function imputedZero(value: LowIncomeHousingBuildingFactValue): boolean | undefined {
  if (value.deepRentSkewed === "violated") return true;
  if (!disposedIn2025(value.ownership)) return false;
  if (value.ownership.recaptureAvoided === undefined) return undefined;
  return !value.ownership.recaptureAvoided;
}

/*
 * DECISION (2026-11-27, by the author): in the 11th year the form's line 6
 * would multiply line 3 by line 5 again (the form face, irs-8609a-face-2025),
 * and item E implies Part II is completed that year ("generally, this can occur
 * after the 11th year", irs-8609a-inst-2025::sec::specific-instructions::b02);
 * line 17 says "The deferred balance of the credit for the first year is
 * allowed in the 11th year" (::line-17::b01). The engine prints lines 1, 2, 3
 * and 5, leaves lines 4 and 6 to 15 blank, enters 0 on line 16 and the deferred
 * credit on lines 17 and 18, the way the line 3 note fills a year with no
 * credit (::line-3-2::b03). Reason: the credit period is 10 years (section
 * 42(f)(1)), so the only credit of the 11th year is the deferred one.
 *
 * DECISION (2026-11-27, by the author): line 17's example enters "0.8750 times
 * the eligible basis ... times the credit percentage. The factor 0.8750 is
 * 1.0000 minus 0.1250" (::line-17::b01), for a building half low-income at the
 * close of its first year; the rule says the 11th year gets "the deferred
 * balance of the credit for the first year" (::line-17::b01). The engine uses
 * the first year's close portion less its modified percentage (0.5000 − 0.1250
 * = 0.3750 in the example). Reason: that is the part of the first year's credit
 * the modified percentage deferred (section 42(f)(2)(B)); the factor 1.0000
 * gives more back than was deferred unless the building was all low-income.
 */
function eleventhYear(
  key: string,
  value: LowIncomeHousingBuildingFactValue,
  basis: Built["partII"],
) {
  const line5 = creditPercentage(
    value.subsidizedCreditPercentage ?? value.form8609.creditPercentage,
    value.minimumCreditPercentage,
  );
  const partII: Form8609APartII = { ...basis, line5, line16: 0 };
  const ownership = value.ownership;
  const partOwner =
    ownership.share !== 1 ||
    daysOwned(ownership) !== undefined ||
    interestChangeIn2025(ownership) !== undefined;
  if (partOwner) return { partII, gap: { fromLine: LINE_17, reason: DEFERRED_CREDIT_PART_OWNER } };
  if (value.firstYear === undefined) return { partII: {}, waitingOn: [key] };
  const line17 = deferredFirstYearCredit(basis.line1 ?? 0, line5, {
    modifiedPortion: tenThousandthsOf(value.firstYear.modifiedPortion),
    yearEndPortion: tenThousandthsOf(value.firstYear.yearEndPortion),
  });
  return { partII: { ...partII, line17, line18: line17 } };
}

/* Part II after items C and D are "Yes" (specific-instructions::b01, b02). */
function partTwo(key: string, value: LowIncomeHousingBuildingFactValue): Built {
  if (value.atRiskFinancing) return { partII: {}, gap: { fromLine: LINE_1, reason: AT_RISK } };
  const year = yearOfCompliancePeriod(value.form8609.firstCreditYear);
  const basis = basisLines(value, year);
  if (basis === undefined) return { partII: {}, waitingOn: [key] };
  const additions =
    year >= 2 ? additionsToQualifiedBasis(basis.line3, value.form8609.originalQualifiedBasis) : 0;
  if (year > DEFERRED_CREDIT_YEAR) {
    // "If 'No,' and the entire credit has been claimed in prior tax years ... do not complete Part II" (::b02).
    if (additions <= 0) return { partII: {} };
    return { partII: {}, gap: { fromLine: LINE_1, reason: ADDITIONS_AFTER_CREDIT_PERIOD } };
  }
  const zero = imputedZero(value);
  if (zero === undefined) return { partII: {}, waitingOn: [key] };
  // "You must enter zero on lines 3 and 16, and skip lines 4 through 15, 17, and 18" (line-3-2::b03).
  if (zero || basis.line3 === 0) return { partII: { ...basis, line3: 0, line16: 0 } };
  if (year === DEFERRED_CREDIT_YEAR && additions > 0)
    return { partII: basis, gap: { fromLine: LINE_7, reason: ADDITIONS_AFTER_CREDIT_PERIOD } };
  if (year === DEFERRED_CREDIT_YEAR) return eleventhYear(key, value, basis);
  return creditYearLines(key, value, year, basis, additions);
}

/*
 * The copy. Items C and D "No": "stop here—do not go to Part II" (the form face;
 * specific-instructions::b01).
 */
export function form8609ACopy(
  key: string,
  value: LowIncomeHousingBuildingFactValue,
): Form8609ACopy {
  const built: Built =
    value.hasSignedForm8609 && value.qualifiedAtYearEnd ? partTwo(key, value) : { partII: {} };
  return { key, building: value, ...built };
}
