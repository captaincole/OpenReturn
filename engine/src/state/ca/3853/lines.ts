/*
 * FTB 3853 arithmetic for 2025: the filing thresholds, the applicable
 * household income, the Individual Shared Responsibility Penalty (Steps 2 to
 * 5, Worksheets A and B, the Penalty Worksheet) and the affordability tests
 * for code A. Pure functions of numbers; each rule names its block in
 * ca-3853-inst-2025.
 */

import { roundDollars, sum, wholePart } from "../../../money.js";

export const MONTHS_IN_YEAR = 12;

/* Step 2 lines 1, 2 and 4; Worksheet A line 5 (step-2-flat-dollar-amount::b01). */
export const ADULT_AMOUNT = 950;
export const CHILD_AMOUNT = 475;
export const FLAT_AMOUNT_CAP = 2_850;
/* "At least 18", counted by month (step-2-flat-dollar-amount::b01). */
export const ADULT_AGE = 18;
/* A household of five or more counts as five (registered-domestic-partners-rdps::b03; Worksheet A line 1). */
export const MEMBER_COUNT_CAP = 5;
/* Step 4 line 5: 2.5% of income over the filing threshold (no-continue::b01). */
export const PERCENTAGE_RATE = 0.025;
/* Step 5: the 2025 state average monthly bronze premium for one person (yes-continue::b01). */
export const BRONZE_MONTHLY_PREMIUM = 377;
/* Coverage is unaffordable above 7.28% of household income (lines-1-12-2::b03). */
export const AFFORDABILITY_RATE = 0.0728;
/* Step 3 question 6: a child on FTB 3803 (step-2-flat-dollar-amount::b02). */
export const FTB_3803_COUNTED_ABOVE = 1_350;
export const FTB_3803_MAGI_CAP = 2_700;

/*
 * The Do I Have to File? charts (california-gross-income::b01): gross income
 * and California AGI, for 0, 1, and 2 or more dependents.
 */
type ByDependents = readonly [number, number, number];
export interface FilingThresholds {
  grossIncome: number;
  agi: number;
}
interface ChartRow {
  grossIncome: ByDependents;
  agi: ByDependents;
}
const SINGLE_UNDER_65: ChartRow = {
  grossIncome: [22_941, 38_774, 50_649],
  agi: [18_353, 34_186, 46_061],
};
const SINGLE_65_OR_OLDER: ChartRow = {
  grossIncome: [30_591, 42_466, 51_966],
  agi: [26_003, 37_878, 47_378],
};
const MARRIED_BY_PEOPLE_65: readonly ChartRow[] = [
  { grossIncome: [45_887, 61_720, 73_595], agi: [36_711, 52_544, 64_419] },
  { grossIncome: [53_537, 65_412, 74_912], agi: [44_361, 56_236, 65_736] },
  { grossIncome: [61_187, 73_062, 82_562], agi: [52_011, 63_886, 73_386] },
];
const TWO_OR_MORE = 2;

export type ThresholdStatus =
  "single" | "head_of_household" | "married_filing_jointly" | "qualifying_surviving_spouse";

/*
 * The chart's amounts for a filing status, the number of filers 65 or older
 * on December 31, 2025, and the dependents claimed. A qualifying surviving
 * spouse's row has the single amounts for 1 and 2 or more dependents and no
 * column for none: undefined then.
 */
export function filingThresholds(
  status: ThresholdStatus,
  people65OrOlder: number,
  dependents: number,
): FilingThresholds | undefined {
  const column = dependents >= TWO_OR_MORE ? TWO_OR_MORE : dependents;
  if (status === "qualifying_surviving_spouse" && column === 0) return undefined;
  const row =
    status === "married_filing_jointly"
      ? MARRIED_BY_PEOPLE_65[people65OrOlder]
      : people65OrOlder > 0
        ? SINGLE_65_OR_OLDER
        : SINGLE_UNDER_65;
  return { grossIncome: row.grossIncome[column], agi: row.agi[column] };
}

/*
 * A child on FTB 3803: line 1b plus the smaller of line 4 or $2,700, counted
 * in the household income only when line 4 is more than $1,350
 * (step-2-flat-dollar-amount::b02 question 6; part-iii::b06).
 */
export function ftb3803ChildMagi(line1b: number, line4: number) {
  return {
    magi: line1b + Math.min(line4, FTB_3803_MAGI_CAP),
    counted: line4 > FTB_3803_COUNTED_ABOVE,
  };
}

/*
 * Step 3 (step-2-flat-dollar-amount::b01–b03): Form 540 line 17, plus
 * California tax-exempt interest, plus the MAGI of each household member who
 * must file (line 4), plus each FTB 3803 child counted (line 6).
 */
export function applicableHouseholdIncome(parts: {
  caAgi: number;
  caTaxExemptInterest: number;
  membersMagi: number[];
}): number {
  return sum(parts.caAgi, parts.caTaxExemptInterest, ...parts.membersMagi);
}

/*
 * Step 4 (step-2-flat-dollar-amount::b04, no-continue::b01): line 3 is the
 * household income less the filing threshold. Zero or less owes no penalty
 * (undefined); else line 5 is 2.5% of it, to the nearest dollar.
 */
export function percentageIncomeAmount(householdIncome: number, threshold: number) {
  const line3 = householdIncome - threshold;
  return line3 <= 0 ? undefined : roundDollars(line3 * PERCENTAGE_RATE);
}

/* The Xs of one month: people with neither coverage nor an exemption, by age. */
export interface MonthXs {
  adults: number;
  children: number;
}

/* Step 2 lines 1 to 4 (step-2-flat-dollar-amount::b01): the yearly flat dollar amount. */
export function flatDollarAmount(adults: number, children: number): number {
  return Math.min(ADULT_AMOUNT * adults + CHILD_AMOUNT * children, FLAT_AMOUNT_CAP);
}

/* Step 5 question 3 (yes-continue::b01): $4,524 a person, up to five people. */
export function bronzeAmountForHousehold(people: number): number {
  return BRONZE_MONTHLY_PREMIUM * MONTHS_IN_YEAR * Math.min(people, MEMBER_COUNT_CAP);
}

export interface WorksheetA {
  line1: number[];
  line5: number[];
  line6: number;
  line7: number;
  line8: number;
}

/*
 * Worksheet A (name-jan-feb-mar-apr-may-jun-jul-aug-sep-oct-nov-dec::b01), January
 * first: line 1 the Xs (5 at most), line 4 the adults plus half the children,
 * line 5 line 4 times $950 (at most $2,850), line 7 line 6 / 12 to the
 * nearest dollar, line 8 the total of line 1.
 */
export function worksheetA(months: MonthXs[]): WorksheetA {
  const line1 = months.map(({ adults, children }) => Math.min(adults + children, MEMBER_COUNT_CAP));
  const line5 = months.map(({ adults, children }) =>
    Math.min((adults + children / 2) * ADULT_AMOUNT, FLAT_AMOUNT_CAP),
  );
  const line6 = sum(...line5);
  return { line1, line5, line6, line7: roundDollars(line6 / MONTHS_IN_YEAR), line8: sum(...line1) };
}

/*
 * Worksheet B (::b02): for each month with an X, the larger of Worksheet A
 * line 5 and Step 4 line 5; line 14 is their total / 12. The penalty line takes
 * whole dollars, so line 14 is rounded to the nearest dollar (QUESTIONS.md).
 */
export function worksheetBLine14(sheetA: WorksheetA, percentageAmount: number): number {
  const columnC = sheetA.line5.map((amount, month) =>
    sheetA.line1[month] > 0 ? Math.max(amount, percentageAmount) : 0,
  );
  return roundDollars(sum(...columnC) / MONTHS_IN_YEAR);
}

export interface PenaltyWorksheet {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  /* The penalty: FTB 3853 Part IV line 1 and Form 540 line 92. */
  line5: number;
}

/*
 * The Individual Shared Responsibility Penalty Worksheet (yes-continue::b01–b02)
 * with no Worksheet A: line 1 the flat dollar amount (Step 2), line 2 the
 * percentage income amount (Step 4), line 3 the larger, line 4 the bronze
 * amount for the household (Step 5 question 3), line 5 the smaller of 3 and 4.
 */
export function penaltyWithoutWorksheetA(
  adults: number,
  children: number,
  percentageAmount: number,
): PenaltyWorksheet {
  const line1 = flatDollarAmount(adults, children);
  const line3 = Math.max(line1, percentageAmount);
  const line4 = bronzeAmountForHousehold(adults + children);
  return { line1, line2: percentageAmount, line3, line4, line5: Math.min(line3, line4) };
}

/*
 * The worksheet with Worksheets A and B: line 1 Worksheet A line 7, lines 2
 * and 3 Worksheet B line 14 (no-continue::b01 question 6; the worksheet B
 * text: "Enter the result on line 2 and line 3"), line 4 $377 times
 * Worksheet A line 8 (yes-continue::b01 question 2), line 5 the smaller of 3 and 4.
 */
export function penaltyWithWorksheetA(
  months: MonthXs[],
  percentageAmount: number,
): PenaltyWorksheet {
  const sheetA = worksheetA(months);
  const line14 = worksheetBLine14(sheetA, percentageAmount);
  const line4 = BRONZE_MONTHLY_PREMIUM * sheetA.line8;
  return {
    line1: sheetA.line7,
    line2: line14,
    line3: line14,
    line4,
    line5: Math.min(line14, line4),
  };
}

/* (A) of the Affordability Worksheet (example-2-5::b06–b07): 7.28% of the household income, raised by salary reduction premiums. */
export function affordabilityThreshold(
  householdIncome: number,
  salaryReductionPremiums: number,
): number {
  return (householdIncome + salaryReductionPremiums) * AFFORDABILITY_RATE;
}

/* The Annualized Required Contribution Worksheet (annualized-required-contribution-worksheet::b01): line 1 / line 2 × 12. */
export function annualizedContribution(contribution: number, fullMonths: number): number {
  return (contribution / fullMonths) * MONTHS_IN_YEAR;
}

/* Coverage is unaffordable when (B) the required contribution is more than (A) the threshold (example-2-5::b08). */
export function isUnaffordable(requiredContribution: number, threshold: number): boolean {
  return requiredContribution > threshold;
}

/* The federal poverty line (federal-poverty-line::b01): $15,060 for one, $5,380 for each more person. */
const POVERTY_LINE_FIRST = 15_060;
const POVERTY_LINE_EACH_MORE = 5_380;
export function federalPovertyLine(people: number): number {
  return POVERTY_LINE_FIRST + POVERTY_LINE_EACH_MORE * (Math.max(people, 1) - 1);
}

/*
 * The Federal Applicable Figure Table (members-of::b08–b10), in ten-thousandths:
 * 0 through 150; +4 a point to 300 (0.0600); +2.5 a point to 400, the half
 * up (301 is 0.0603); 0.0850 at 400 or more.
 */
const FIGURE_SCALE = 10_000;
const FIGURE_FLOOR_PERCENT = 150;
const FIGURE_BREAK_PERCENT = 300;
const FIGURE_CAP_PERCENT = 400;
const FIGURE_LOWER_STEP = 4;
const FIGURE_UPPER_STEP = 2.5;
const FIGURE_AT_BREAK = 600;
const FIGURE_AT_CAP = 850;
export function applicableFigure(percent: number): number {
  if (percent <= FIGURE_FLOOR_PERCENT) return 0;
  if (percent <= FIGURE_BREAK_PERCENT) {
    return (FIGURE_LOWER_STEP * (percent - FIGURE_FLOOR_PERCENT)) / FIGURE_SCALE;
  }
  if (percent < FIGURE_CAP_PERCENT) {
    const scaled = FIGURE_AT_BREAK + FIGURE_UPPER_STEP * (percent - FIGURE_BREAK_PERCENT);
    return roundDollars(scaled) / FIGURE_SCALE;
  }
  return FIGURE_AT_CAP / FIGURE_SCALE;
}

export interface MarketplaceWorksheetInputs {
  bronzeMonthlyPremium: number; // line 1
  householdIncome: number; // line 2
  nontaxableSocialSecurity: number; // line 3
  householdSize: number; // line 5: the people in the household less dependents not claimed
  slcspMonthlyPremium: number; // line 10
  marriedFilingSeparately: boolean;
}

/*
 * The Marketplace Coverage Affordability Worksheet (members-of::b04–b07): the
 * monthly required contribution (line 12) is the bronze premium less the
 * premium assistance (line 11: the silver premium less line 9, the monthly
 * share of household income the applicable figure sets). A married filer
 * filing separately enters line 1 on line 12. Line 13 is line 12 × 12.
 */
export function marketplaceAnnualContribution(inputs: MarketplaceWorksheetInputs): number {
  const line1 = inputs.bronzeMonthlyPremium;
  if (inputs.marriedFilingSeparately) return line1 * MONTHS_IN_YEAR;
  const line4 = inputs.householdIncome + inputs.nontaxableSocialSecurity;
  const line5 = federalPovertyLine(inputs.householdSize);
  const line11 =
    line4 / line5 < 1 ? 0 : premiumAssistance(line4, line5, inputs.slcspMonthlyPremium);
  const line12 = Math.max(0, line1 - line11);
  return line12 * MONTHS_IN_YEAR;
}

/* Lines 7 to 11: line 7 is line 6 × 100 rounded down, then the table. */
function premiumAssistance(line4: number, line5: number, line10: number): number {
  const line7 = applicableFigure(wholePart((line4 * 100) / line5));
  const line9 = (line4 * line7) / MONTHS_IN_YEAR;
  return Math.max(0, line10 - line9);
}
