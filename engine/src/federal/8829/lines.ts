/*
 * Form 8829 for one business's home office, from its homeOfficeActual answers,
 * for Schedule C line 30 (read before Form 8829 is evaluated) and the form's
 * bindings. Each line is rounded; a line that is arithmetic on others uses their
 * rounded amounts.
 */

import type { BusinessFactValue, HomeExpenses, HomeOfficeActual } from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Line 3 "as a percentage": the instructions give no rounding rule. The engine
 * keeps two decimal places (11.08%), the precision of the IRS e-file ratio, and
 * lines 13 and 24 multiply by the line as printed.
 */
const PERCENT_SCALE = 10000;

export const OWNED_HOME_GAP =
  "An owned home's mortgage interest, real estate taxes and depreciation (lines 10, 11, 16, 17 and Part III) are not modeled.";
export const PART_OF_INCOME_GAP =
  "Not all of the business's gross income is from the home, and no fact gives the part that is (line 8, irs-8829-inst-2025::sec::part-ii::b01).";

export const SHARED_HOME_GAP =
  "Two or more of the owner's businesses have a home office by actual expenses; one Form 8829 covers each home and line 36 is allocated among its businesses (irs-8829-inst-2025::sec::line-36::b01), and no fact says which offices share a home.";

export type HomeExpenseLine = keyof HomeExpenses;

/* Why one business's Form 8829 cannot stand alone: another of the owner's businesses has one too. */
export function sharedHomeGap(
  business: BusinessFactValue,
  onReturn: readonly BusinessFactValue[],
): string | undefined {
  if (!business.homeOfficeActual) return undefined;
  const owner = business.owner ?? "taxpayer";
  const others = onReturn.filter(
    (other) =>
      other !== business && other.homeOfficeActual && (other.owner ?? "taxpayer") === owner,
  );
  return others.length > 0 ? SHARED_HOME_GAP : undefined;
}

/* Line 3 (and line 7, with no daycare) as a ratio with four decimal places: 0.1108 prints as 11.08. */
export function businessPercentage(office: HomeOfficeActual): number | undefined {
  if (office.homeSquareFeet <= 0) return undefined;
  return (
    roundDollars((office.businessSquareFeet / office.homeSquareFeet) * PERCENT_SCALE) /
    PERCENT_SCALE
  );
}

/* Why the engine does not figure line 36, or undefined when it does or still waits. */
export function homeOfficeActualGap(office: HomeOfficeActual): string | undefined {
  if (office.ownsHome === true) return OWNED_HOME_GAP;
  if (office.allGrossIncomeFromHome === false) return PART_OF_INCOME_GAP;
  return undefined;
}

/* The answers line 36 needs and the fact does not give yet. */
export function homeOfficeActualOpen(office: HomeOfficeActual): boolean {
  return office.ownsHome === undefined || office.allGrossIncomeFromHome === undefined;
}

export interface Form8829Figures {
  line7: number;
  line8: number;
  line15: number;
  /* Line 23 column (a) and column (b), blank when no expense is given. */
  line23a: number | undefined;
  line23b: number | undefined;
  line24: number | undefined;
  line25: number | undefined;
  line26: number;
  line27: number;
  line28: number;
  line31: number | undefined;
  line32: number;
  line33: number;
  line34: number;
  line36: number;
  line43: number;
  line44: number;
}

const OPERATING_LINES: HomeExpenseLine[] = [
  "insurance",
  "rent",
  "repairsAndMaintenance",
  "utilities",
  "other",
];

/* Lines 18–22 of one column, each rounded, then line 23 of that column (16 and 17 are an owner's only). */
export function operatingColumn(expenses: HomeExpenses | undefined): number | undefined {
  return sumOrBlank(...OPERATING_LINES.map((line) => roundDollars(expenses?.[line])));
}

/*
 * Part II for a renter whose gross income is all from the home (the cases
 * homeOfficeActualGap leaves): lines 9–14 have nothing (no casualty, mortgage
 * interest or real estate taxes), and Part III has no depreciation. tentativeProfit
 * is Schedule C line 29 (line 8; no Form 8949 or 4797 amount is tied to the business).
 */
export function form8829Figures(
  office: HomeOfficeActual,
  tentativeProfit: number,
): Form8829Figures {
  const line7 = businessPercentage(office) ?? 0;
  const line8 = tentativeProfit;
  const line15 = atLeast(0, line8);
  const line23a = operatingColumn(office.direct);
  const line23b = operatingColumn(office.indirect);
  const line24 = line23b === undefined ? undefined : roundDollars(line23b * line7);
  const line25 = roundDollars(office.operatingExpenseCarryover);
  const line26 = sum(line23a, line24, line25);
  const line27 = Math.min(line15, line26);
  const line28 = line15 - line27;
  const line31 = roundDollars(office.casualtyAndDepreciationCarryover);
  const line32 = sum(line31);
  const line33 = Math.min(line28, line32);
  const line34 = line27 + line33;
  return {
    line7,
    line8,
    line15,
    line23a,
    line23b,
    line24,
    line25,
    line26,
    line27,
    line28,
    line31,
    line32,
    line33,
    line34,
    line36: line34,
    line43: atLeast(0, line26 - line27),
    line44: atLeast(0, line32 - line33),
  };
}
