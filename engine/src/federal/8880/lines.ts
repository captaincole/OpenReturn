import { atLeast, roundDollars, sum } from "../../money.js";
import type { FilingStatus } from "../../values.js";

/* Line 6: at most $2,000 per person (irs-8880-form-2025::sec::face-page-1::b02). */
export const CONTRIBUTION_LIMIT_PER_PERSON = 2_000;

/*
 * The Caution: no credit when line 11a is more than $39,500 ($59,250 head of
 * household, $79,000 married filing jointly)
 * (irs-8880-form-2025::sec::face-page-1::b01, ::who-can-take-this-credit::b01).
 */
export const AGI_LIMIT_JOINT = 79_000;
export const AGI_LIMIT_HEAD_OF_HOUSEHOLD = 59_250;
export const AGI_LIMIT_OTHER = 39_500;

/*
 * The line 9 table (irs-8880-form-2025::sec::face-page-1::b02): each row is
 * "But not over" and the digit after "0." for each filing status column. The
 * last row ("Over $79,000") is 0 in every column.
 */
interface RateRow {
  butNotOver: number;
  joint: number;
  headOfHousehold: number;
  other: number;
}

export const LINE_9_TABLE: ReadonlyArray<RateRow> = [
  { butNotOver: 23_750, joint: 5, headOfHousehold: 5, other: 5 },
  { butNotOver: 25_500, joint: 5, headOfHousehold: 5, other: 2 },
  { butNotOver: 35_625, joint: 5, headOfHousehold: 5, other: 1 },
  { butNotOver: 38_250, joint: 5, headOfHousehold: 2, other: 1 },
  { butNotOver: 39_500, joint: 5, headOfHousehold: 1, other: 1 },
  { butNotOver: 47_500, joint: 5, headOfHousehold: 1, other: 0 },
  { butNotOver: 51_000, joint: 2, headOfHousehold: 1, other: 0 },
  { butNotOver: 59_250, joint: 1, headOfHousehold: 1, other: 0 },
  { butNotOver: 79_000, joint: 1, headOfHousehold: 0, other: 0 },
];

/* Line 9 prints one digit after the printed "0.": the rate in tenths. */
const TENTHS = 10;

/* The Caution's AGI limit for a filing status. */
export function agiLimit(status: FilingStatus): number {
  if (status === "married_filing_jointly") return AGI_LIMIT_JOINT;
  if (status === "head_of_household") return AGI_LIMIT_HEAD_OF_HOUSEHOLD;
  return AGI_LIMIT_OTHER;
}

/* Line 9: the digit after "0." for line 8 and the filing status; 0 over the last row. */
export function line9Digit(line8: number, status: FilingStatus): number {
  const row = LINE_9_TABLE.find((each) => line8 <= each.butNotOver);
  if (row === undefined) return 0;
  if (status === "married_filing_jointly") return row.joint;
  if (status === "head_of_household") return row.headOfHousehold;
  return row.other;
}

/* One column's inputs, before rounding: line 1, line 2 and line 4. */
export interface ColumnInputs {
  iraAndAbleContributions: number;
  electiveDeferrals: number;
  distributions: number;
}

export interface ColumnLines {
  line1: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
}

/*
 * Lines 1 through 6 of one column. Lines 1, 2 and 4 are document sums: the
 * cents add, then the total rounds. Line 3 adds lines 1 and 2; line 5 is line 3
 * less line 4, -0- when zero or less; line 6 is the smaller of line 5 and
 * $2,000 (irs-8880-form-2025::sec::face-page-1::b01, ::b02).
 */
export function columnLines(inputs: ColumnInputs): ColumnLines {
  const line1 = roundDollars(inputs.iraAndAbleContributions);
  const line2 = roundDollars(inputs.electiveDeferrals);
  const line3 = line1 + line2;
  const line4 = roundDollars(inputs.distributions);
  const line5 = atLeast(0, line3 - line4);
  const line6 = Math.min(line5, CONTRIBUTION_LIMIT_PER_PERSON);
  return { line1, line2, line3, line4, line5, line6 };
}

/* Line 7: add the line 6 amounts (irs-8880-form-2025::sec::line-7::b01). A blank column adds 0. */
export function line7(...line6s: ReadonlyArray<number | undefined>): number {
  return sum(...line6s);
}

/* Line 10: line 7 times the line 9 rate, to the nearest dollar. */
export function line10(line7Amount: number, digit: number): number {
  return roundDollars((line7Amount * digit) / TENTHS);
}

export interface CreditLimitLines {
  line1: number;
  line2: number;
  /* The limit; 0 when line 1 less line 2 is zero or less ("stop"). */
  line3: number;
  /* False when line 3 is zero or less: "you can't take the credit". */
  creditAllowed: boolean;
}

/*
 * The Credit Limit Worksheet (irs-8880-form-2025::sec::credit-limit-worksheet::b01):
 * line 1 is Form 1040 line 18; line 2 adds Schedule 3 lines 1 through 3, 6d and
 * 6l; line 3 is line 1 less line 2, and zero or less stops the form.
 */
export function creditLimit(
  line18: number,
  scheduleThreeCredits: ReadonlyArray<number | undefined>,
): CreditLimitLines {
  const line2 = sum(...scheduleThreeCredits);
  const difference = line18 - line2;
  return {
    line1: line18,
    line2,
    line3: atLeast(0, difference),
    creditAllowed: difference > 0,
  };
}

/* Line 12: the smaller of line 10 and line 11 (irs-8880-form-2025::sec::face-page-1::b02). */
export function line12(line10Amount: number, line11Amount: number): number {
  return Math.min(line10Amount, line11Amount);
}
