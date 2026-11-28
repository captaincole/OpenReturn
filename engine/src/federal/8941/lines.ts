/*
 * Form 8941 (2025), lines 1 to 14 and Worksheets 1 to 7: pure arithmetic.
 * Cents are kept while adding the worksheet columns, and each line rounds once
 * (the 1040 rule). Lines 15 to 20 are in bindings.ts.
 */

import { atLeast, roundDollars, roundToPlaces, sum, wholePart } from "../../money.js";

/* Worksheet 2 line 2 and Worksheet 7 line 2: "Hours of service per FTE ... 2,080" (irs-8941-inst-2025::sec::worksheet-2-information-needed-to::b01). */
export const HOURS_PER_FTE = 2_080;
/* Worksheet 1 column (b): "Don't enter more than 2,080 hours for any employee" (irs-8941-inst-2025::sec::column-a-individuals-considered::b05). */
export const MAX_HOURS_PER_EMPLOYEE = 2_080;
/* Worksheet 2 line 3: "if the result is less than one, enter 1". */
const MIN_FTES = 1;
/* Line 2: "If you entered 25 or more, skip lines 3 through 11 and enter -0- on line 12" (irs-8941-face-2025::sec::face-page-1::b02). */
export const FTE_LIMIT = 25;
/* Line 8: "If line 2 is 10 or less, enter the amount from line 7" (irs-8941-face-2025::sec::face-page-1::b03). */
export const FTE_PHASEOUT_START = 10;
/* Worksheet 5 lines 3 and 4: "Subtract 10 from line 2 ... Divide line 3 by 15" (irs-8941-inst-2025::sec::worksheet-5-information-needed-to::b01). */
export const FTE_PHASEOUT_RANGE = 15;
/* Worksheet 3 line 3: "round the result down to the next lowest multiple of $1,000" (irs-8941-inst-2025::sec::worksheet-3-information-needed-to::b01). */
export const WAGE_MULTIPLE = 1_000;
/* Line 3: "If you entered $67,000 or more, skip lines 4 through 11 and enter -0- on line 12" (irs-8941-face-2025::sec::face-page-1::b02). */
export const WAGE_LIMIT = 67_000;
/* Line 9: "If line 3 is $33,000 or less, enter the amount from line 8" (irs-8941-face-2025::sec::face-page-1::b03). */
export const WAGE_PHASEOUT_LINE = 33_000;
/* Worksheet 6 lines 4 and 5: "Subtract $33,300 from line 3 ... Divide line 4 by $33,300" (irs-8941-inst-2025::sec::worksheet-6-information-needed-to::b01). */
export const WAGE_PHASEOUT_AMOUNT = 33_300;
/* Line 7: "All other small employers, multiply line 6 by 50% (0.50)" (irs-8941-face-2025::sec::face-page-1::b03). */
export const CREDIT_RATE = 0.5;

/* Worksheet 4 column (b) and (c) of one employee, with cents. */
export interface PremiumRow {
  employerPremiumsPaid: number;
  adjustedAveragePremium: number;
}

/* One employee as the worksheets read them. */
export interface WorksheetEmployee {
  /* Worksheet 1 column (b), already 0 for a seasonal employee. */
  hours: number;
  /* Worksheet 1 column (c), already 0 for a seasonal employee. */
  wages: number;
  /* Worksheet 4 columns (b) and (c); undefined when not enrolled. */
  premiums?: PremiumRow;
}

/* Lines 1 to 14; a line the form skips is undefined. */
export interface CreditLines {
  line1: number;
  line2: number;
  line3?: number;
  line4?: number;
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12: number;
  line13?: number;
  line14?: number;
}

/*
 * Worksheet 1 column (b): "Don't enter more than 2,080 hours for any employee.
 * But enter -0- for seasonal employees who worked 120 or fewer days"
 * (irs-8941-inst-2025::sec::column-a-individuals-considered::b05).
 */
export function hoursOfService(hours: number, seasonal: boolean): number {
  return seasonal ? 0 : Math.min(hours, MAX_HOURS_PER_EMPLOYEE);
}

/*
 * Worksheet 2 line 3 and Worksheet 7 line 3: "Divide line 1 by line 2. If the
 * result isn't a whole number ... round the result down to the next lowest
 * whole number ... However, if the result is less than one, enter 1"
 * (irs-8941-inst-2025::sec::worksheet-2-information-needed-to::b01,
 * worksheet-7-information-needed-to::b01).
 */
export function fullTimeEquivalents(totalHours: number): number {
  return Math.max(MIN_FTES, wholePart(roundToPlaces(totalHours / HOURS_PER_FTE, 6)));
}

/*
 * Worksheet 3 line 3: "Divide line 1 by line 2. If the result isn't a multiple
 * of $1,000 ... round the result down to the next lowest multiple of $1,000"
 * (irs-8941-inst-2025::sec::worksheet-3-information-needed-to::b01). The
 * quotient is taken to the cent first, so float error never drops $1,000.
 */
export function averageAnnualWages(totalWages: number, ftes: number): number {
  const average = roundToPlaces(totalWages / ftes, 2);
  return wholePart(average / WAGE_MULTIPLE) * WAGE_MULTIPLE;
}

/*
 * Worksheet 4 column (c): "the premiums you would've paid if the employee had
 * enrolled in a plan or plans with a total premium equal to the average
 * premium" (irs-8941-inst-2025::sec::column-a-enrolled-individuals::b03). As in
 * Example 4 (::b03, ::b04), the employer's share of the plan's premium applies
 * to the average premium for the same period: what the employer paid times the
 * average premium over the plan's premium. Cents kept.
 */
export function adjustedAveragePremium(
  employerPremiumsPaid: number,
  averagePremium: number,
  annualPremium: number,
): number {
  return (employerPremiumsPaid * averagePremium) / annualPremium;
}

/*
 * Line 8, Worksheet 5: line 7 less line 7 × (line 2 − 10) ÷ 15
 * (irs-8941-inst-2025::sec::worksheet-5-information-needed-to::b01). Line 4 of
 * the worksheet keeps every digit (QUESTIONS.md item 3); line 5 rounds to the
 * dollar.
 *
 * DECISION (2026-11-27, by the author): the phaseout ratios keep every digit.
 * Text A, Worksheet 5 line 4 and Worksheet 6 line 5: "Enter the result as a
 * decimal (rounded to at least 3 places)"
 * (irs-8941-inst-2025::sec::worksheet-5-information-needed-to::b01,
 * worksheet-6-information-needed-to::b01), which allows any number of places.
 * Text B, the regulation's example: "The credit reduction for FTEs in excess of
 * 10 is $6,400 ($48,000 × 2/15)" (26 CFR 1.45R-3(c)(3), Example 2), the exact
 * fraction; 3 places (0.133) give $6,384. The engine keeps every digit, which
 * Text A allows and Text B shows (docs/rule-decisions.md A135).
 */
export function ftePhaseout(line7: number, line2: number): number {
  if (line2 <= FTE_PHASEOUT_START) return line7;
  const ratio = (line2 - FTE_PHASEOUT_START) / FTE_PHASEOUT_RANGE;
  return line7 - roundDollars(line7 * ratio);
}

/*
 * Line 9, Worksheet 6: line 8 less line 7 × (line 3 − $33,300) ÷ $33,300
 * (irs-8941-inst-2025::sec::worksheet-6-information-needed-to::b01), every
 * digit of the ratio kept (the decision above). Never below 0: "the FTE and
 * average annual wage limitations ... will separately reduce your credit. This
 * may reduce your credit to zero" (irs-8941-inst-2025::sec::eligible-small-employers::b02,
 * ::b03; QUESTIONS.md item 4). The amount is a parameter for the regulation's
 * example, which uses another year's. Line 3 is a multiple of $1,000, so "line
 * 3 is $33,000 or less" (WAGE_PHASEOUT_LINE) and "line 3 is not more than
 * $33,300" are the same test (QUESTIONS.md item 5).
 */
export function wagePhaseout(
  line7: number,
  line8: number,
  line3: number,
  phaseoutAmount: number = WAGE_PHASEOUT_AMOUNT,
): number {
  if (line3 <= phaseoutAmount) return line8;
  const ratio = (line3 - phaseoutAmount) / phaseoutAmount;
  return atLeast(0, line8 - roundDollars(line7 * ratio));
}

/* Lines 4 to 12 once lines 2 and 3 are under their limits. */
function premiumLines(
  enrolled: ReadonlyArray<PremiumRow>,
  line2: number,
  line3: number,
  stateSubsidies: number,
) {
  const line4 = roundDollars(sum(...enrolled.map((row) => row.employerPremiumsPaid)));
  const line5 = roundDollars(sum(...enrolled.map((row) => row.adjustedAveragePremium)));
  const line6 = Math.min(line4, line5);
  const line7 = roundDollars(line6 * CREDIT_RATE);
  const line8 = ftePhaseout(line7, line2);
  const line9 = wagePhaseout(line7, line8, line3);
  const line10 = roundDollars(stateSubsidies);
  // Line 11: "Subtract line 10 from line 4. If zero or less, enter -0-".
  const line11 = atLeast(0, line4 - line10);
  // Line 12: "Enter the smaller of line 9 or line 11".
  const line12 = Math.min(line9, line11);
  return { line4, line5, line6, line7, line8, line9, line10, line11, line12 };
}

/*
 * Lines 13 and 14: "If line 12 is zero, skip lines 13 and 14". Line 13 counts
 * the enrolled employees (Worksheet 4 column (a)); line 14 is Worksheet 7, their
 * Worksheet 1 hours over 2,080 (irs-8941-inst-2025::sec::column-a-enrolled-individuals::b04,
 * worksheet-7-information-needed-to::b01).
 */
function enrolledLines(employees: ReadonlyArray<WorksheetEmployee>, line12: number) {
  if (line12 <= 0) return {};
  const enrolled = employees.filter((employee) => employee.premiums !== undefined);
  return {
    line13: enrolled.length,
    line14: fullTimeEquivalents(sum(...enrolled.map((employee) => employee.hours))),
  };
}

/*
 * Lines 1 to 14 from the worksheets. Line 1 counts Worksheet 1's rows; line 2
 * is Worksheet 2; line 3 is Worksheet 3, skipped at 25 FTEs or more; lines 4 to
 * 11 are skipped at 25 FTEs or at $67,000 of average wages, and line 12 is then
 * 0 (irs-8941-face-2025::sec::face-page-1::b02).
 */
export function creditLines(
  employees: ReadonlyArray<WorksheetEmployee>,
  stateSubsidies: number,
): CreditLines {
  const line1 = employees.length;
  const line2 = fullTimeEquivalents(sum(...employees.map((employee) => employee.hours)));
  if (line2 >= FTE_LIMIT) return { line1, line2, line12: 0 };
  const line3 = averageAnnualWages(sum(...employees.map((employee) => employee.wages)), line2);
  if (line3 >= WAGE_LIMIT) return { line1, line2, line3, line12: 0 };
  const enrolled = employees.flatMap((employee) => (employee.premiums ? [employee.premiums] : []));
  const lines = premiumLines(enrolled, line2, line3, stateSubsidies);
  return { line1, line2, line3, ...lines, ...enrolledLines(employees, lines.line12) };
}

/* Line 16: "Add lines 12 and 15" (irs-8941-face-2025::sec::face-page-1::b04). */
export function line16Of(line12: number | undefined, line15: number | undefined): number {
  return sum(line12, line15);
}
