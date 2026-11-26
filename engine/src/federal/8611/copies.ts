/*
 * One Form 8611 from one building fact: the lines its facts settle, or the
 * first line that is a gap. Pure: no form reads, so Schedule 2 and the form
 * read the same copy.
 */

import type {
  FlowThroughLowIncomeHousingRecapture,
  LowIncomeHousingPriorYear,
  OwnLowIncomeHousingRecapture,
} from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { Form8611Copy } from "./filingInfo.js";
import { recaptureInterest } from "./interest.js";
import {
  basisDecreasePercentage,
  line2Worksheet,
  netRecapture,
  ownPartLines,
  recaptureLines,
  recapturePercentage,
  thousandthsOf,
  unusedAcceleratedPortion,
  yearOfCompliancePeriod,
  type Line2Worksheet,
} from "./lines.js";

/* The recapture year: the 2025 return. */
export const RECAPTURE_YEAR = 2025;

const LINE_4 = 4;
const LINE_11 = 11;

export const OUTSIDE_TABLE =
  "Line 4's table lists years 2 through 15 of the compliance period (irs-8611-form-2025::sec::line-4::b01); the building's first credit year puts 2025 outside it.";

/* A recapture event this year: line 6 above 0 (line-6::b01; purpose-of-form::b03). */
export function hasRecaptureEvent(value: OwnLowIncomeHousingRecapture): boolean {
  return basisDecreasePercentage(value.basisChange) > 0;
}

/* Lines 9 to 15 once line 9 and the line 11 interest are known. */
function withInterest(
  copy: Form8611Copy,
  recapture: number,
  line9: number,
  unusedCredits: number,
  interest: (line10: number) => ReturnType<typeof recaptureInterest>,
): Form8611Copy {
  const line10 = netRecapture(recapture, line9);
  const line11 = interest(line10);
  if (line11.kind === "gap") return { ...copy, gap: { fromLine: LINE_11, reason: line11.reason } };
  return { ...copy, recapture: recaptureLines(line9, line10, line11.amount, unusedCredits) };
}

/* The Line 2 Worksheet of each prior year whose Form 8609-A line 7 was completed (line-2::b01). */
const worksheetsOf = (years: readonly LowIncomeHousingPriorYear[]) =>
  years.map((year) => (year.additions ? line2Worksheet(year.additions) : undefined));

/* Each prior year's part of line 3: its credit less its worksheet's i. */
function interestYears(
  years: readonly LowIncomeHousingPriorYear[],
  worksheets: ReadonlyArray<Line2Worksheet | undefined>,
) {
  return years.map((year, index) => ({
    taxYear: year.taxYear,
    weight: year.credit - (worksheets[index]?.lineI ?? 0),
  }));
}

/* A building the owner figures: lines 1 to 7, then 9 to 15. */
export function ownCopy(value: OwnLowIncomeHousingRecapture): Form8611Copy {
  const worksheets = worksheetsOf(value.priorYears);
  const filled = worksheets.filter((worksheet): worksheet is Line2Worksheet => !!worksheet);
  const copy: Form8611Copy = {
    building: value.building,
    worksheet: filled.length === 1 ? filled[0] : undefined,
  };
  const line4 = recapturePercentage(yearOfCompliancePeriod(value.firstCreditYear, RECAPTURE_YEAR));
  const own = ownPartLines({
    credits: value.priorYears.map((year) => year.credit),
    worksheets: filled,
    line4: line4 ?? 0,
    line6: basisDecreasePercentage(value.basisChange),
    acceleratedPortionRecapturedEarlier: value.acceleratedPortionRecapturedEarlier,
  });
  // Lines 1 to 3 still print; line 4 on is the gap.
  if (line4 === undefined)
    return { ...copy, own, gap: { fromLine: LINE_4, reason: OUTSIDE_TABLE } };
  const line9 = unusedAcceleratedPortion(
    value.unusedCredits,
    value.unusedCreditsFromAdditions,
    own.line4,
    own.line6,
  );
  const years = interestYears(value.priorYears, worksheets);
  return withInterest({ ...copy, own }, own.line7, line9, value.unusedCredits, (line10) =>
    recaptureInterest(line10, years, RECAPTURE_YEAR),
  );
}

/*
 * DECISION (2026-11-25, by the author): a K-1 recipient "skip[s] lines 1–7 and
 * go[es] to line 8" (irs-8611-form-2025::sec::specific-instructions::b01), yet
 * line 9 multiplies the unused credits "by the decimal amount on line 4" and
 * "on line 6" (::line-9::b01). The engine takes the two decimals of the
 * entity's own Form 8611 from its statement and leaves lines 4 and 6 blank.
 * Reason: they are the decimals the K-1 amount on line 8 was figured with,
 * and the flow-through entity gives the building's details to its owners
 * (::purpose-of-form::b02). With no unused credit, line 9 is 0 and needs none.
 */
function flowThroughLine9(value: FlowThroughLowIncomeHousingRecapture): number | undefined {
  if (value.unusedCredits - value.unusedCreditsFromAdditions <= 0) return 0;
  const { entityRecapturePercentage: line4, entityBasisDecreasePercentage: line6 } = value;
  if (line4 === undefined || line6 === undefined) return undefined;
  return unusedAcceleratedPortion(
    value.unusedCredits,
    value.unusedCreditsFromAdditions,
    thousandthsOf(line4),
    thousandthsOf(line6),
  );
}

/*
 * A K-1's recapture: line 8, then 9 to 15. A section 42(j)(5) partnership
 * includes the interest in its amount: "Enter -0- on line 11" (line-11::b01).
 */
export function flowThroughCopy(
  key: string,
  value: FlowThroughLowIncomeHousingRecapture,
  k1Amount: number,
  section42j5: boolean,
): Form8611Copy {
  const line8 = roundDollars(k1Amount);
  const copy: Form8611Copy = { building: value.building, line8, section42j5 };
  const line9 = flowThroughLine9(value);
  // The decimals are an answer the fact is missing: the copy asks for the fact again.
  if (line9 === undefined) return { ...copy, waitingOn: [key] };
  const years = value.priorYears.map((year) => ({ taxYear: year.taxYear, weight: year.credit }));
  return withInterest(copy, line8, line9, value.unusedCredits, (line10) =>
    section42j5 ? { kind: "figured", amount: 0 } : recaptureInterest(line10, years, RECAPTURE_YEAR),
  );
}
