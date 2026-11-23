/*
 * Form 1116 Parts III and IV, the line 16 loss allocations, the Worksheet for
 * Line 18 and the election to claim the credit without the form. Pure
 * arithmetic; whole dollars on each line.
 */

import { atLeast, roundDollars, roundToPlaces, sum } from "../../money.js";
import type { Unsupported } from "../../types.js";
import type { FilingStatus } from "../../values.js";
import { RATIO_PLACES } from "./partI.js";

/*
 * The election: "Your total creditable foreign taxes aren't more than $300
 * ($600 if married filing a joint return)"
 * (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b02).
 */
export const ELECTION_LIMIT = 300;
export const ELECTION_LIMIT_JOINT = 600;

export function electionLimit(filingStatus: FilingStatus): number {
  return filingStatus === "married_filing_jointly" ? ELECTION_LIMIT_JOINT : ELECTION_LIMIT;
}

/*
 * The election's credit: "the smaller of (a) your total foreign tax, or (b)
 * your regular tax" (irs-1116-inst-2025::sec::publications-see-pub-514-foreign-tax-credit-for::b03).
 * The taxes are document amounts: cents kept, the total rounded.
 */
export function electionCredit(foreignTaxes: ReadonlyArray<number>, regularTax: number): number {
  return Math.min(roundDollars(sum(...foreignTaxes)), atLeast(0, regularTax));
}

/*
 * The adjustment exception (irs-1116-inst-2025::sec::individuals-who-completed-a-qualified-dividends::b02):
 * QDCG worksheet line 5 no more than $394,600 (joint or qualifying surviving
 * spouse) or $197,300 (every other status), and foreign qualified dividends
 * plus foreign net capital gain under $20,000.
 */
export const EXCEPTION_INCOME_LIMIT_JOINT = 394600;
export const EXCEPTION_INCOME_LIMIT = 197300;
export const EXCEPTION_FOREIGN_LIMIT = 20000;

export function qualifiesForAdjustmentException(
  filingStatus: FilingStatus,
  qdcgLine5: number,
  foreignPreferential: number,
): boolean {
  const joint =
    filingStatus === "married_filing_jointly" || filingStatus === "qualifying_surviving_spouse";
  const limit = joint ? EXCEPTION_INCOME_LIMIT_JOINT : EXCEPTION_INCOME_LIMIT;
  return qdcgLine5 <= limit && foreignPreferential < EXCEPTION_FOREIGN_LIMIT;
}

/*
 * The adjustments are required when QDCG worksheet line 5 is more than 0 and
 * line 23 is less than line 24 (irs-1116-inst-2025::sec::individuals-who-completed-a-qualified-dividends::b01).
 */
export function adjustmentRequired(qdcgLine5: number, qdcgLine23: number, qdcgLine24: number) {
  return qdcgLine5 > 0 && qdcgLine23 < qdcgLine24;
}

/*
 * Worksheet for Line 18 (irs-1116-inst-2025::sec::lines-2-through-5::b01, b02),
 * for a filer of the Qualified Dividends and Capital Gain Tax Worksheet: lines
 * 2–5 skipped; line 6 = QDCG line 20, line 8 = QDCG line 17, line 10 = QDCG
 * line 9 (line-6-2::b01, line-8-2::b01, line-10-2::b01).
 */
export const TWENTY_RATE_WORKSHEET_FACTOR = 0.4595;
export const FIFTEEN_RATE_WORKSHEET_FACTOR = 0.5946;

export interface Line18Worksheet {
  line1: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
}

export function line18Worksheet(
  line1: number,
  qdcg: { line9: number; line17: number; line20: number },
): Line18Worksheet {
  const line7 = roundDollars(qdcg.line20 * TWENTY_RATE_WORKSHEET_FACTOR);
  const line9 = roundDollars(qdcg.line17 * FIFTEEN_RATE_WORKSHEET_FACTOR);
  const line11 = line7 + line9 + qdcg.line9;
  return {
    line1,
    line6: qdcg.line20,
    line7,
    line8: qdcg.line17,
    line9,
    line10: qdcg.line9,
    line11,
    line12: atLeast(0, line1 - line11),
  };
}

/*
 * Line 16, adjustments 2 and 3 (irs-1116-inst-2025::sec::line-16::b02–b06).
 * 2: a category's loss reduces the other categories' income "in the same
 * proportion as each category's income bears to the total foreign income"
 * (irs-pub-514-2025::sec::foreign-losses::b01); what is left reduces U.S. income.
 * 3: a net U.S. loss, the total of line 15 over the line 18 amount, reduces the
 * income left in each category in proportion to it. The result is each
 * category's line 16 (0 for the loss categories and with no adjustment).
 */
export function line16Adjustments<K extends string>(
  line15: Readonly<Record<K, number>>,
  line18Amount: number,
): Record<K, number> {
  const keys = Object.keys(line15) as K[];
  const income = (key: K) => atLeast(0, line15[key]);
  const totalIncome = sum(...keys.map(income));
  const totalLoss = sum(...keys.map((key) => atLeast(0, -line15[key])));
  const absorbed = Math.min(totalLoss, totalIncome);
  const afterLosses = {} as Record<K, number>;
  for (const key of keys) {
    const share = totalIncome > 0 ? roundDollars((absorbed * income(key)) / totalIncome) : 0;
    afterLosses[key] = income(key) - share;
  }
  const remaining = sum(...keys.map((key) => afterLosses[key]));
  const usLoss = Math.min(
    atLeast(0, sum(...keys.map((key) => line15[key])) - line18Amount),
    remaining,
  );
  const out = {} as Record<K, number>;
  for (const key of keys) {
    const usShare = remaining > 0 ? roundDollars((usLoss * afterLosses[key]) / remaining) : 0;
    out[key] = income(key) > 0 ? afterLosses[key] - usShare - income(key) : 0;
  }
  return out;
}

/*
 * Line 19: "Divide line 17 by line 18. If line 18 is zero, enter 0. If line 18
 * is greater than zero and line 17 is more than line 18, enter 1"
 * (irs-1116-inst-2025::sec::line-19::b01); 0 when line 17 is zero or less (the
 * form's line 17). The ratio keeps four places, as line 3f does (QUESTIONS.md).
 */
export function line19Ratio(line17: number, line18: number): number {
  if (line17 <= 0 || line18 <= 0) return 0;
  if (line17 > line18) return 1;
  return roundToPlaces(line17 / line18, RATIO_PLACES);
}

/* A line: a number, blank (undefined: nothing applies, or it waits for an answer), or a gap. */
export type Value = number | Unsupported | undefined;

export const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && "unsupported" in value;

/* The first gap, else undefined when any value waits, else null: every value is a number. */
export function blocker(...values: Value[]): Unsupported | undefined | null {
  const gap = values.find(isGap);
  if (gap) return gap;
  return values.some((value) => value === undefined) ? undefined : null;
}

/* The line from its inputs once each is a number; else the gap or the wait. */
export function figured(values: Value[], compute: (numbers: number[]) => number): Value {
  const block = blocker(...values);
  return block === null ? compute(values as number[]) : block;
}

export interface PartIIIInputs {
  line11: Value;
  /* Lines 12 and 13: 0 when blank, or the gap. */
  line12: Value;
  line13: Value;
  line15: Value;
  /* Line 16: 0 with no adjustment. */
  line16: Value;
  /* The line 18 amount before the floor at 0 (taxable income for the limit, or the worksheet). */
  line18Amount: Value;
  /* Line 20, at least 0. */
  line20: Value;
  /* Line 22: 0 when blank, or the gap. */
  line22: Value;
}

export interface PartIIIValues {
  line14: Value;
  line17: Value;
  line18: Value;
  line19: Value;
  line21: Value;
  line23: Value;
  line24: Value;
}

/* Line 18: skipped when line 17 is zero or less; -0- when the amount is (irs-1116-inst-2025::sec::line-18::b01). */
function line18Of(line17: Value, amount: Value): Value {
  if (typeof line17 !== "number") return line17;
  if (line17 <= 0) return undefined;
  return figured([amount], ([value]) => atLeast(0, value));
}

/* Line 19: 0 when line 17 is zero or less (the form), else lines.ts line19Ratio. */
function line19Of(line17: Value, line18: Value): Value {
  if (typeof line17 === "number" && line17 <= 0) return 0;
  return figured([line17, line18], ([seventeen, eighteen]) => line19Ratio(seventeen, eighteen));
}

/*
 * Lines 14 and 17–24 (the form; irs-1116-inst-2025::sec::line-24::b01): line 14
 * combines 11, 12 and 13; line 17 = 15 + 16; line 21 = line 20 × line 19; line
 * 23 = 21 + 22; line 24 is the smaller of 14 and 23. A gap carries forward.
 */
export function partIIIValues(inputs: PartIIIInputs): PartIIIValues {
  const line14 = figured([inputs.line11, inputs.line12, inputs.line13], ([eleven]) => eleven);
  const line17 = figured([inputs.line15, inputs.line16], ([fifteen, sixteen]) => fifteen + sixteen);
  const line18 = line18Of(line17, inputs.line18Amount);
  const line19 = line19Of(line17, line18);
  const line21 = figured([inputs.line20, line19], ([twenty, ratio]) =>
    roundDollars(twenty * ratio),
  );
  const line23 = figured(
    [line21, inputs.line22],
    ([twentyOne, twentyTwo]) => twentyOne + twentyTwo,
  );
  const line24 = figured([line14, line23], ([fourteen, twentyThree]) =>
    Math.min(fourteen, twentyThree),
  );
  return { line14, line17, line18, line19, line21, line23, line24 };
}

export interface PartIVLines {
  line27: number | undefined;
  line28: number | undefined;
  line32: number;
  line33: number;
  line35: number;
}

/*
 * Part IV (irs-1116-inst-2025::sec::part-iv-summary-of-separate::b01, line-33::b01):
 * line 24 of each Form 1116 on its category's line; line 32 adds them; line 33
 * is the smaller of line 20 and line 32; line 34 (the boycott reduction) is
 * blank, so line 35 is line 33.
 */
export function partIVLines(
  passiveLine24: number | undefined,
  generalLine24: number | undefined,
  line20: number,
): PartIVLines {
  const line32 = sum(passiveLine24, generalLine24);
  const line33 = Math.min(atLeast(0, line20), line32);
  return { line27: passiveLine24, line28: generalLine24, line32, line33, line35: line33 };
}
