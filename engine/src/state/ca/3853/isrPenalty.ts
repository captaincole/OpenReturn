/*
 * FTB 3853 Part IV line 1, the Individual Shared Responsibility Penalty
 * (ca-3853-inst-2025::sec::line-1-individual-shared-responsibility-penalty::b01):
 * "Enter your Individual Shared Responsibility Penalty amount from step 5 of
 * the Individual Shared Responsibility Penalty Worksheet." Form 540 line 92
 * takes the same amount. Blank when no penalty is owed: no month has an X, or
 * the household income is at or under the threshold (Part II).
 */

import { unsupported, type Unsupported } from "../../../types.js";
import { NO_COVERAGE } from "./codes.js";
import type { Ca3853Member } from "./filingInfo.js";
import {
  MONTHS_IN_YEAR,
  penaltyWithWorksheetA,
  penaltyWithoutWorksheetA,
  percentageIncomeAmount,
  type FilingThresholds,
  type MonthXs,
} from "./lines.js";
import {
  NOT_FORM_540,
  TAX_EXEMPT_INTEREST_UNKNOWN,
  files3853,
  householdIncome,
  isGap,
  memberCodes,
  partIIBox,
  thresholdsOf,
  type Ca3853Info,
  type HouseholdIncome,
  type ReadField,
} from "./penalty.js";

type Result<T> = T | Unsupported | undefined;

/* Worksheet A's Xs by month, January first; undefined while a date of birth waits. */
function monthXs(members: Ca3853Member[], codes: string[][][]): MonthXs[] | undefined {
  const months: MonthXs[] = [];
  for (let index = 0; index < MONTHS_IN_YEAR; index++) {
    const month = { adults: 0, children: 0 };
    for (const [position, person] of members.entries()) {
      if (!codes[position][index].includes(NO_COVERAGE)) continue;
      if (person.adultFromMonth === undefined) return undefined;
      if (person.adultFromMonth <= index + 1) month.adults += 1;
      else month.children += 1;
    }
    months.push(month);
  }
  return months;
}

/*
 * Step 1 questions 3 and 4 (step-1-all-filers::b01–b02): no one had coverage
 * or an exemption in any month, and no one turned 18 in 2025, so Step 2 and
 * Step 5 question 3 apply with no Worksheet A.
 */
function skipsWorksheetA(members: Ca3853Member[], codes: string[][][]): boolean {
  return (
    codes.every((months) =>
      months.every((month) => month.length === 1 && month[0] === NO_COVERAGE),
    ) && members.every((person) => !person.turned18In2025)
  );
}

/* Every member's codes, or the first gap or wait among them. */
function allCodes(read: ReadField, info: Ca3853Info): Result<string[][][]> {
  const results = (info.ca3853?.members ?? []).map((person) => memberCodes(person, read, info));
  const gap = results.find(isGap);
  if (gap !== undefined) return gap;
  if (results.some((result) => result === undefined)) return undefined;
  return results as string[][][];
}

export function isrPenalty(read: ReadField, info: Ca3853Info): Result<number> {
  if (!files3853(info)) return undefined;
  if (info.mustFile?.["form-540"]?.value !== true) return NOT_FORM_540;
  const household = info.ca3853;
  if (household === undefined || household.claimableAsDependent !== false) return undefined;
  const box = partIIBox(read, info);
  if (box !== false) return box === true ? undefined : box;
  const thresholds = thresholdsOf(info) as FilingThresholds;
  const income = householdIncome(read, info) as HouseholdIncome;
  const codes = allCodes(read, info);
  if (codes === undefined || isGap(codes)) return codes;
  const months = monthXs(household.members, codes);
  if (months === undefined) return undefined;
  if (months.every(({ adults, children }) => adults + children === 0)) return undefined;
  const percentage = percentageIncomeAmount(income.amount, thresholds.grossIncome);
  if (percentage === undefined) return undefined;
  const [january] = months;
  const sheet = skipsWorksheetA(household.members, codes)
    ? penaltyWithoutWorksheetA(january.adults, january.children, percentage)
    : penaltyWithWorksheetA(months, percentage);
  // A floor of the household income settles the penalty only when the bronze amount caps it.
  if (!income.exact && sheet.line3 < sheet.line4) return unsupported(TAX_EXEMPT_INTEREST_UNKNOWN);
  return sheet.line5;
}
