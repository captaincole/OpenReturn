/*
 * Form 6765 (Rev. December 2024), Sections A, B and C and the Section D
 * limits: pure arithmetic. The rates are printed on the form
 * (irs-6765-face-2025::sec::face-page-1::b01 to ::b03) and are the statute's;
 * none changes by year. Section F and Section G are in qualifiedExpenses.ts.
 */

import type {
  FixedBaseInputs,
  ResearchBaseYear,
  ResearchPayrollTaxElection,
} from "../../facts/kinds/researchCredit.js";
import { atLeast, roundDollars, roundToPlaces, sum, sumOrBlank } from "../../money.js";

/* Line 10: "Multiply line 5 by 50% (0.50)". */
export const BASE_AMOUNT_FLOOR_RATE = 0.5;
/* Line 13: 20%, or 15.8% with the section 280C election. */
export const REGULAR_RATE = 0.2;
export const REDUCED_REGULAR_RATE = 0.158;
/* Line 19: "Multiply line 18 by 20% (0.20)". */
export const ASC_BASIC_RESEARCH_RATE = 0.2;
/* Line 22: "Divide line 21 by 6.0". */
export const ASC_DIVISOR = 6;
/* Line 24: 14% of line 23, or 6% of line 20 when lines 22 and 23 are skipped. */
export const ASC_RATE = 0.14;
export const ASC_NO_HISTORY_RATE = 0.06;
/* Line 26: "multiply line 25 by 79% (0.79)" with the section 280C election. */
export const ASC_REDUCED_FACTOR = 0.79;

/* Line 6: "not more than 16% (0.16)"; rounded "to the nearest 1/100th of 1% (that is, four decimal places)" (irs-6765-inst-2025::sec::line-6::b03). */
export const FIXED_BASE_CAP = 0.16;
export const FIXED_BASE_PLACES = 4;
/* "For the first 5 tax years beginning after 1993 for which you have QREs, the percentage is 3%" (line-6::b02). */
export const START_UP_RATE = 0.03;
export const START_UP_FLAT_YEARS = 5;

/*
 * The later start-up years (irs-6765-inst-2025::sec::line-6::b02, ::b03): how
 * many base years the rule names and what the ratio is divided by. The 11th
 * and later years take "any 5 of the 5th through 10th such tax years" with no
 * divisor.
 */
const START_UP_RULES: Readonly<Record<number, { years: number; divisor: number }>> = {
  6: { years: 2, divisor: 6 },
  7: { years: 2, divisor: 3 },
  8: { years: 3, divisor: 2 },
  9: { years: 4, divisor: 1.5 },
  10: { years: 5, divisor: 1.2 },
};
const LATER_START_UP_RULE = { years: 5, divisor: 1 };

/* Line 34: "do not enter more than $500,000" (irs-6765-inst-2025::sec::line-34::b01). */
export const PAYROLL_TAX_CREDIT_CAP = 500_000;
/* A qualified small business: "Gross receipts of less than $5 million for the tax year" (qualified-small-business-payroll-tax-credit::b01). */
export const QUALIFIED_SMALL_BUSINESS_RECEIPTS = 5_000_000;
/* "No gross receipts for any tax year before the 5-tax-year period ending with the tax year" (same block). */
export const QUALIFIED_SMALL_BUSINESS_YEARS = 5;
/* "An election can't be made for a tax year if an election was made for 5 or more preceding tax years" (::b03). */
export const MAX_PRIOR_PAYROLL_ELECTIONS = 5;
/* An eligible small business: average annual gross receipts for the 3 preceding tax years not over $50 million (eligible-small-business-for-purposes-of::b01). */
export const ELIGIBLE_SMALL_BUSINESS_RECEIPTS = 50_000_000;
export const ELIGIBLE_SMALL_BUSINESS_YEARS = 3;
export const TAX_YEAR = 2025;

const average = (amounts: number[]) => sum(...amounts) / amounts.length;

/*
 * A line the engine cannot figure, with the reason. These files are read by
 * the facts layer (activitiesOnReturn.ts), so they hold the reason only; the
 * bindings turn it into an unsupported result (cells.ts).
 */
export interface FigureGap {
  gap: string;
}

export const isFigureGap = (value: unknown): value is FigureGap =>
  typeof value === "object" && value !== null && typeof (value as FigureGap).gap === "string";

/* The ratio of a start-up's base years, divided as its year's rule says; a gap when the years do not fit the rule. */
function startUpRatio(yearWithQres: number, baseYears: ResearchBaseYear[]): number | FigureGap {
  if (yearWithQres <= START_UP_FLAT_YEARS) return START_UP_RATE;
  const rule = START_UP_RULES[yearWithQres] ?? LATER_START_UP_RULE;
  if (baseYears.length !== rule.years) {
    return {
      gap: `The fixed-base percentage of the ${yearWithQres}th year with QREs takes ${rule.years} base years; ${baseYears.length} are stated.`,
    };
  }
  const receipts = sum(...baseYears.map((year) => year.grossReceipts));
  if (receipts <= 0) return { gap: "The base years have no gross receipts to divide by." };
  return sum(...baseYears.map((year) => year.qualifiedResearchExpenses)) / receipts / rule.divisor;
}

/* Line 6 as a decimal: the computed percentage rounded to four places, at most 16%. */
export function fixedBasePercentage(inputs: FixedBaseInputs): number | FigureGap {
  let ratio: number | FigureGap;
  if (inputs.kind === "existing") {
    if (inputs.grossReceipts1984To1988 <= 0) {
      return { gap: "The 1984 to 1988 gross receipts are 0, so there is no ratio." };
    }
    ratio = inputs.qualifiedResearchExpenses1984To1988 / inputs.grossReceipts1984To1988;
  } else {
    ratio = startUpRatio(inputs.yearWithQres, inputs.baseYears ?? []);
  }
  if (typeof ratio !== "number") return ratio;
  return Math.min(FIXED_BASE_CAP, roundToPlaces(ratio, FIXED_BASE_PLACES));
}

/* Line 6 as printed: the percentage before the printed "%" sign (0.0254 → "2.54"). */
export const percentageText = (rate: number): string => String(roundToPlaces(rate * 100, 2));

/* Line 7: the average of the stated preceding years (irs-6765-inst-2025::sec::line-7::b01). */
export const averageGrossReceipts = (years: number[]) => roundDollars(average(years));

/* The eligible small business test: the average of the last 3 stated years, at most $50 million. */
export function isEligibleSmallBusiness(years: number[]): boolean {
  return average(years.slice(-ELIGIBLE_SMALL_BUSINESS_YEARS)) <= ELIGIBLE_SMALL_BUSINESS_RECEIPTS;
}

export interface RegularCredit {
  line1?: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
  line13: number;
}

/* Section A. Lines 2 to 4 are a corporation's (line-2::b01): blank on an individual's return, and line 12 adds 1, 4 and 11. */
export function regularCredit(input: {
  energyConsortia?: number;
  qres: number;
  fixedBase: number;
  grossReceiptsPriorYears: number[];
  reduced: boolean;
}): RegularCredit {
  const line1 = roundDollars(input.energyConsortia);
  const line5 = input.qres;
  const line7 = averageGrossReceipts(input.grossReceiptsPriorYears);
  const line8 = roundDollars(line7 * input.fixedBase);
  const line9 = atLeast(0, line5 - line8);
  const line10 = roundDollars(line5 * BASE_AMOUNT_FLOOR_RATE);
  const line11 = Math.min(line9, line10);
  const line12 = sum(line1, line11);
  const rate = input.reduced ? REDUCED_REGULAR_RATE : REGULAR_RATE;
  const line13 = roundDollars(line12 * rate);
  return {
    line1,
    line5,
    line6: input.fixedBase,
    line7,
    line8,
    line9,
    line10,
    line11,
    line12,
    line13,
  };
}

export interface SimplifiedCredit {
  line14?: number;
  line18?: number;
  line19?: number;
  line20: number;
  line21: number;
  line22?: number;
  line23?: number;
  line24: number;
  line25: number;
  line26: number;
}

/*
 * Section B. Lines 15 to 17 are the basic research payments of a corporation:
 * blank, so line 18 is line 14. "If you had no QREs in any 1 of those years,
 * skip lines 22 and 23" (face-page-1::b03), and line 24 is 6% of line 20.
 */
export function simplifiedCredit(input: {
  energyConsortia?: number;
  qres: number;
  priorThreeYearsQres: number[];
  reduced: boolean;
}): SimplifiedCredit {
  const line14 = roundDollars(input.energyConsortia);
  const line18 = sumOrBlank(line14);
  const line19 = line18 === undefined ? undefined : roundDollars(line18 * ASC_BASIC_RESEARCH_RATE);
  const line20 = input.qres;
  const line21 = roundDollars(sum(...input.priorThreeYearsQres));
  const skip = input.priorThreeYearsQres.some((qres) => qres === 0);
  const line22 = skip ? undefined : roundDollars(line21 / ASC_DIVISOR);
  const line23 = line22 === undefined ? undefined : atLeast(0, line20 - line22);
  const line24 =
    line23 === undefined
      ? roundDollars(line20 * ASC_NO_HISTORY_RATE)
      : roundDollars(line23 * ASC_RATE);
  const line25 = sum(line19, line24);
  const line26 = input.reduced ? roundDollars(line25 * ASC_REDUCED_FACTOR) : line25;
  return { line14, line18, line19, line20, line21, line22, line23, line24, line25, line26 };
}

/* Line 28: "Subtract line 27 from line 13 or line 26 (whichever applies). If zero or less, enter -0-". */
export const line28Of = (credit: number, line27: number | undefined) =>
  atLeast(0, credit - sum(line27));

/*
 * Why the payroll tax election cannot be made, or undefined when it can: the
 * qualified small business test and the five-year limit
 * (irs-6765-inst-2025::sec::qualified-small-business-payroll-tax-credit::b01, ::b03).
 */
export function payrollElectionGap(election: ResearchPayrollTaxElection): string | undefined {
  if (election.grossReceipts >= QUALIFIED_SMALL_BUSINESS_RECEIPTS) {
    return "The payroll tax election needs a qualified small business: 2025 gross receipts are $5 million or more.";
  }
  if (election.firstYearWithGrossReceipts <= TAX_YEAR - QUALIFIED_SMALL_BUSINESS_YEARS) {
    return "The payroll tax election needs a qualified small business: it had gross receipts before the 5-tax-year period ending with 2025.";
  }
  if (election.priorElections >= MAX_PRIOR_PAYROLL_ELECTIONS) {
    return "The payroll tax election can't be made after elections for 5 or more preceding tax years.";
  }
  return undefined;
}

/* Line 34: the elected amount, at most $500,000. */
export const line34Of = (election: ResearchPayrollTaxElection) =>
  Math.min(roundDollars(election.amount), PAYROLL_TAX_CREDIT_CAP);

/* The Form 3800 lines the line 35 worksheet reads (irs-6765-inst-2025::sec::line-44::b01, ::b02). */
export interface CarryforwardWorksheetInputs {
  partILine5?: number;
  partILine6?: number;
  partIILine25?: number;
  partIILine35?: number;
  partIILine36?: number;
  partIILine38?: number;
}

/*
 * The Worksheet for Figuring General Business Credit Carryforward: line 1 is
 * Part I line 6 plus Part II lines 25 and 36; line 2 is Part II line 38; line
 * 3 subtracts; line 4 is Part I line 5 and Part II line 35 (the carrybacks
 * from 2026); line 5, the carryforward, subtracts line 4 from line 3, at
 * least 0.
 */
export function carryforwardWorksheet(form3800: CarryforwardWorksheetInputs): number {
  const line1 = sum(form3800.partILine6, form3800.partIILine25, form3800.partIILine36);
  const line3 = line1 - sum(form3800.partIILine38);
  const line4 = sum(form3800.partILine5, form3800.partIILine35);
  return atLeast(0, line3 - line4);
}

/* Line 36 for an individual: "the smallest of line 28, line 34, or line 35". */
export const line36Of = (line28: number, line34: number, line35: number) =>
  Math.min(line28, line34, line35);
