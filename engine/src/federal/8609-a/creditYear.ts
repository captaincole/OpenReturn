/*
 * Part II in a year of the 10-year credit period: lines 4 to 16 and 18
 * (irs-8609a-inst-2025::sec::line-4::b01 to ::line-18::b01).
 */

import type { LowIncomeHousingBuildingFactValue } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { Form8609APartII } from "./filingInfo.js";
import {
  creditAllowed,
  creditPercentage,
  disallowedForGrants,
  line11Worksheet,
  lowIncomePortion,
  oneThirdOf,
  partYear,
  tenThousandthsOf,
  timesDecimal,
  type Line11Worksheet,
} from "./lines.js";
import { DAYS_IN_YEAR, daysOwned, interestChangeIn2025, shareOfCredit } from "./ownership.js";

/* What a copy's Part II builder returns. */
export interface Built {
  partII: Form8609APartII;
  worksheet?: Line11Worksheet;
  waitingOn?: string[];
  gap?: { fromLine: number; reason: string };
}

const LINE_7 = 7;
const LINE_11 = 11;
const LINE_16 = 16;

/*
 * A whole-year owner's credit is held to the allocation by line 15's limit
 * (Form 8609 line 1b). A part-year owner's lines 4 and 8 already count the days
 * owned, so that limit, a whole year's credit, does not hold them to it.
 */
export const ADDITIONS_PART_YEAR =
  "Additions to qualified basis above Form 8609 line 3a for an owner who held the building for part of the year: \"You may claim a credit for an addition to qualified basis only if the credit amounts have been allocated by the housing credit agency to cover these additions\" (irs-8609a-inst-2025::sec::line-6::b02), and line 15's limit (Form 8609 line 1b) is a whole year's credit; the instructions do not say how to hold a part-year credit to the allocation.";
export const WORKSHEET_PART_YEAR =
  "The Line 11 Worksheet for an owner who held the building for part of the year: the worksheet figures a whole year's modification, and the instructions do not say whether it is prorated like lines 4 and 8 (irs-8609a-inst-2025::sec::line-11::b01; ::line-8::b01).";
export const SHARE_CHANGE_PART_YEAR =
  "An interest that changed in a year the owner also acquired or disposed of the building: the instructions weigh a change by the days of the whole year (irs-8609a-inst-2025::sec::line-16::b03, b04), and lines 4 and 8 already count the days owned.";

/*
 * DECISION (2026-11-27, by the author): the Line 11 Worksheet's line 4 takes
 * each month's increase "over the low-income portion of the building at the
 * close of the previous tax year (the amount on line 2 of the previous tax
 * year's Form 8609-A)" (irs-8609a-inst-2025::sec::line-14::b03). In the second
 * year of the credit period, the previous year's line 2 is the first-year
 * modified percentage, not the portion at the close of that year
 * (::proc-2014-49-2014-37-i-r-b-535-at-irs-gov-pub-irs-drop::b01). The engine
 * uses the first year's close portion in year 2, and the previous line 2 after.
 * Reason: the modified percentage is an average of the year, so every month of
 * year 2 would show a false increase; the IRS audit guide for section 42
 * (part 7, chapter 17) compares the months with the first year's close portion.
 */
function baselinePortion(value: LowIncomeHousingBuildingFactValue, year: number) {
  const increase = value.increase;
  if (increase === undefined) return undefined;
  if (year !== 2) return tenThousandthsOf(increase.priorYearLowIncomePortion);
  return value.firstYear === undefined
    ? undefined
    : tenThousandthsOf(value.firstYear.yearEndPortion);
}

interface CreditBasis {
  line1: number;
  line2: number;
  line3: number;
}

/* Lines 7 to 12 (line-6::b02 to line-11::b01), or the fact it waits on, or a gap at line 11. */
function additionLines(
  value: LowIncomeHousingBuildingFactValue,
  year: number,
  basis: CreditBasis,
  additions: { line5: number; line7: number; days?: number },
) {
  const baseline = baselinePortion(value, year);
  const increase = value.increase;
  if (increase === undefined || baseline === undefined) return undefined;
  const { line5, line7, days } = additions;
  const line8 = days === undefined ? 0 : partYear(line7, days, DAYS_IN_YEAR);
  const line9 = oneThirdOf(line5);
  const line10 = timesDecimal(days === undefined ? line7 : line8, line9);
  const worksheet = line11Worksheet({
    line1: basis.line1,
    line3: basis.line3,
    line5,
    line7,
    originalQualifiedBasis: value.form8609.originalQualifiedBasis,
    priorYearLine1: increase.priorYearEligibleBasis,
    priorYearLine2: tenThousandthsOf(increase.priorYearLowIncomePortion),
    baselinePortion: baseline,
    monthEnds: increase.monthEnds.map(lowIncomePortion),
  });
  const lines: Form8609APartII = { line7, line8, line9, line10 };
  if (worksheet !== undefined && days !== undefined)
    return { lines, gap: { fromLine: LINE_11, reason: WORKSHEET_PART_YEAR } };
  const line11 = worksheet?.line7 ?? 0;
  return { lines: { ...lines, line11, line12: line10 + line11 }, worksheet };
}

/* Lines 13 to 16 and 18 from line 6 and line 12. */
function creditLines(
  key: string,
  value: LowIncomeHousingBuildingFactValue,
  year: number,
  line1: number,
  amounts: { line6: number; line12: number; partYear: boolean },
): Built {
  const line13 = amounts.line6 - amounts.line12;
  // "If ... this is the first year of the credit period ... or no federal grant was received, enter zero on line 14" (line-14::b01).
  const line14 =
    year === 1
      ? 0
      : disallowedForGrants(
          line13,
          line1,
          value.federalGrants ?? 0,
          value.form8609.highCostBasisPercentage,
        );
  const line15 = creditAllowed(line13, line14, value.form8609.maximumCreditAmount);
  const partII: Form8609APartII = { line13, line14, line15 };
  if (amounts.partYear && interestChangeIn2025(value.ownership) !== undefined)
    return { partII, gap: { fromLine: LINE_16, reason: SHARE_CHANGE_PART_YEAR } };
  const share = shareOfCredit(value.ownership);
  if (share === undefined) return { partII: {}, waitingOn: [key] };
  const line16 = roundDollars(line15 * share);
  return { partII: { ...partII, line16, line18: line16 } };
}

/* Lines 4 to 18 in years 1 to 10, after lines 1 to 3. */
export function creditYearLines(
  key: string,
  value: LowIncomeHousingBuildingFactValue,
  year: number,
  basis: CreditBasis,
  additions: number,
): Built {
  const days = daysOwned(value.ownership);
  // "If you owned the building ... for the entire year, enter zero on line 4" (line-4::b01).
  const line4 = days === undefined ? 0 : partYear(basis.line3, days, DAYS_IN_YEAR);
  const line5 = creditPercentage(
    value.subsidizedCreditPercentage ?? value.form8609.creditPercentage,
    value.minimumCreditPercentage,
  );
  // Line 6: line 3 for the whole year, line 4 for part of it (line-6::b01).
  const line6 = timesDecimal(days === undefined ? basis.line3 : line4, line5);
  const head: Form8609APartII = { ...basis, line4, line5, line6 };
  // "If you are not claiming a credit for additions ... skip lines 7 through 12" (line-6::b02; line-7::b01).
  if (year === 1 || additions <= 0) {
    const tail = creditLines(key, value, year, basis.line1, {
      line6,
      line12: 0,
      partYear: days !== undefined,
    });
    return { ...tail, partII: tail.waitingOn ? {} : { ...head, ...tail.partII } };
  }
  if (days !== undefined && basis.line3 > value.form8609.maximumQualifiedBasis)
    return { partII: head, gap: { fromLine: LINE_7, reason: ADDITIONS_PART_YEAR } };
  const added = additionLines(value, year, basis, { line5, line7: additions, days });
  if (added === undefined) return { partII: {}, waitingOn: [key] };
  if (added.gap) return { partII: { ...head, ...added.lines }, gap: added.gap };
  const tail = creditLines(key, value, year, basis.line1, {
    line6,
    line12: added.lines.line12 ?? 0,
    partYear: days !== undefined,
  });
  if (tail.waitingOn) return tail;
  return {
    ...tail,
    partII: { ...head, ...added.lines, ...tail.partII },
    worksheet: added.worksheet,
  };
}
