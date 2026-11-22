import type { SavingsBondCashedFactValue } from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Line 10 and the line 12 divisor (irs-8815-form-2025::sec::omb-no-1545-0074::b02):
 * $99,500 and $15,000 if single, head of household or qualifying surviving
 * spouse; $149,250 and $30,000 if married filing jointly. The line 9 Note's
 * limits ($114,500; $179,250) are the start plus the range
 * (irs-pub-970-2025::sec::effect-of-the-amount-of-your-income-4::b01).
 */
export interface PhaseOutLimits {
  start: number;
  range: number;
}

export const PHASE_OUT_2025 = {
  single: { start: 99_500, range: 15_000 },
  joint: { start: 149_250, range: 30_000 },
} as const satisfies Record<string, PhaseOutLimits>;

/* Line 6 Worksheet line 3: a paper series EE bond cost 50% of its face value (irs-8815-form-2025::sec::line-6::b01). */
export const PAPER_EE_PRICE_SHARE = 0.5;

/* Lines 7 and 12: "Enter the result as a decimal (rounded to at least three places)". */
export const RATIO_PLACES = 3;
const RATIO_SCALE = 1000;

/* Issued after 1989 (irs-8815-form-2025::sec::u-s-savings-bonds-that-qualify-for-exclusion::b01). */
export const FIRST_QUALIFIED_ISSUE_DATE = "1990-01-01";

/* Line 1 prints three rows; "If you need more space, attach a statement" (omb-no-1545-0074::b01). */
export const LINE_1_ROW_COUNT = 3;

/* A series EE or I bond issued after 1989 that passes the ownership test (u-s-savings-bonds-that-qualify::b01). */
export function bondQualifies(bond: SavingsBondCashedFactValue): boolean {
  const series = bond.series === "EE" || bond.series === "I";
  return series && bond.ownerQualifies === true && bond.issueDate >= FIRST_QUALIFIED_ISSUE_DATE;
}

/* The price paid counts at 50% of face for a paper EE bond, at face for any other. */
const isPaperEE = (bond: SavingsBondCashedFactValue) =>
  bond.series === "EE" && bond.format === "paper";

export interface Line6Worksheet {
  line1: number;
  line2?: number;
  line3?: number;
  line4?: number;
  line5: number;
  line6: number;
  line7?: number;
  line8?: number;
  /* Form 8815 line 6: worksheet line 8, or line 6 when no interest was reported before. */
  formLine6: number;
}

/*
 * The Line 6 Worksheet (irs-8815-form-2025::sec::line-6::b01, b02), whole
 * dollars. Line 1 is Form 8815 line 5. Lines 7 and 8 only when interest on
 * these bonds was reported in earlier years ("stop here" otherwise).
 */
export function line6Worksheet(bonds: ReadonlyArray<SavingsBondCashedFactValue>): Line6Worksheet {
  const line1 = roundDollars(sum(...bonds.map((bond) => bond.proceeds)));
  const line2 = roundDollars(sumOrBlank(...bonds.filter(isPaperEE).map((bond) => bond.faceValue)));
  const line3 = line2 === undefined ? undefined : roundDollars(line2 * PAPER_EE_PRICE_SHARE);
  const line4 = roundDollars(
    sumOrBlank(...bonds.filter((bond) => !isPaperEE(bond)).map((bond) => bond.faceValue)),
  );
  const line5 = sum(line3, line4);
  const line6 = line1 - line5;
  const reported = sum(...bonds.map((bond) => bond.interestReportedInPriorYears));
  if (!(reported > 0)) return { line1, line2, line3, line4, line5, line6, formLine6: line6 };
  const line7 = roundDollars(reported);
  const line8 = line6 - line7;
  return { line1, line2, line3, line4, line5, line6, line7, line8, formLine6: line8 };
}

/* A ratio rounded to three places, times 1,000: 650 is 0.650. "1.000" when the part is at least the whole. */
export function scaledRatio(part: number, whole: number): number {
  if (part >= whole) return RATIO_SCALE;
  return roundDollars((part / whole) * RATIO_SCALE);
}

/*
 * The printed ratio: the digit before the decimal point and the three after it.
 * Below 1 the digit before the point stays empty, as in the filled Form 8815 of
 * Pub. 970 (2007), p. 57 ("× . 850").
 */
export function ratioDigits(scaled: number): { whole: string; decimal: string } {
  return {
    whole: scaled >= RATIO_SCALE ? "1" : "",
    decimal: String(scaled % RATIO_SCALE).padStart(RATIO_PLACES, "0"),
  };
}

/* "Multiply line N by line M": an amount times the printed ratio, nearest dollar. */
export function timesRatio(amount: number, scaled: number): number {
  return roundDollars((amount * scaled) / RATIO_SCALE);
}

export interface ExpenseLines {
  line4: number;
  /* Lines 5–8: undefined when line 4 is zero or less ("stop") or no qualified bond was cashed. */
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
}

/* Lines 4 through 8 (omb-no-1545-0074::b01, b02); line 6 comes from the Line 6 Worksheet. */
export function expenseLines(
  line2: number,
  line3: number | undefined,
  worksheet: Line6Worksheet | undefined,
): ExpenseLines {
  const line4 = line2 - sum(line3);
  if (line4 <= 0 || worksheet === undefined || worksheet.line1 <= 0) return { line4 };
  const line5 = worksheet.line1;
  const line6 = worksheet.formLine6;
  const line7 = scaledRatio(line4, line5);
  return { line4, line5, line6, line7, line8: timesRatio(line6, line7) };
}

export interface PhaseOutLines {
  line10: number;
  line11: number;
  /* Skipped when line 11 is zero ("If zero or less, skip line 12"). */
  line12?: number;
  line13: number;
  line14: number;
}

/*
 * Lines 10 through 14 (omb-no-1545-0074::b02, b03). Undefined when line 9 is
 * at or above the upper limit: the Note says stop, no exclusion. Line 11 prints
 * 0 when line 9 is at or below line 10.
 */
export function phaseOutLines(
  line8: number,
  line9: number,
  limits: PhaseOutLimits,
): PhaseOutLines | undefined {
  if (line9 >= limits.start + limits.range) return undefined;
  const line10 = limits.start;
  const over = line9 - line10;
  if (over <= 0) return { line10, line11: 0, line13: 0, line14: line8 };
  const line12 = scaledRatio(over, limits.range);
  const line13 = timesRatio(line8, line12);
  return { line10, line11: over, line12, line13, line14: line8 - line13 };
}

export interface Line9Worksheet {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
}

/*
 * The Line 9 Worksheet (irs-8815-form-2025::sec::step-action::b03): line 1 is
 * Schedule B line 2 (interest before this exclusion), line 2 the other income
 * lines, line 4 the Schedule 1 adjustments it names.
 */
export function line9Worksheet(
  scheduleBLine2: number,
  otherIncome: number,
  adjustments: number,
): Line9Worksheet {
  const line3 = scheduleBLine2 + otherIncome;
  return {
    line1: scheduleBLine2,
    line2: otherIncome,
    line3,
    line4: adjustments,
    line5: line3 - adjustments,
  };
}
