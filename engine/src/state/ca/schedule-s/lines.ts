/*
 * Schedule S, Other State Tax Credit: the arithmetic of one copy (one other
 * state), pure. Written by hand from ca-540-sched-s-inst-2025; no published
 * example with numbers exists (QUESTIONS.md).
 */

import type { OtherStateTaxItem } from "../../../facts/index.js";
import { atLeast, roundDollars, roundToPlaces, sum } from "../../../money.js";

/* Part I has three rows (the blank form). */
export const PART_I_ROWS = 3;
/* Lines 5 and 10: "Do not enter more than 1.0000" (the form): four places. */
export const RATIO_PLACES = 4;
export const RATIO_LIMIT = 1;
/* Line 12: "Use credit code 187" (ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b03). */
export const OTHER_STATE_CREDIT_CODE = "187";
/* The Credit Table's name for code 187 (ca-540-sched-p-inst-2025::sec::credit-table::b02). */
export const OTHER_STATE_CREDIT_NAME = "Other State Tax";

/*
 * The states and U.S. possessions whose net income tax a California resident
 * may take a credit for (ca-540-sched-s-inst-2025::sec::c-california-residents::b01).
 * Virginia is in the list for dual residents only; it is in VIRGINIA below.
 */
// prettier-ignore
export const RESIDENT_CREDIT_STATES: ReadonlySet<string> = new Set([
  "AL", "AS", "AR", "CO", "CT", "DE", "DC", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "PA", "PR", "RI", "SC", "TN", "UT", "VT", "VI", "WV",
  "WI",
]);
/* "Virginia (VA) (dual residents*)" (ca-540-sched-s-inst-2025::sec::c-california-residents::b01, b02). */
export const VIRGINIA = "VA";
/*
 * A group nonresident return filed with a listed state, "as well as Arizona
 * (AZ), Oregon (OR), or Virginia (VA)" (ca-540-sched-s-inst-2025::sec::c-california-residents::b02).
 */
export const GROUP_RETURN_ONLY_STATES: ReadonlySet<string> = new Set(["AZ", "OR", VIRGINIA]);

export interface CreditStateAnswers {
  state: string;
  dualResident?: boolean;
  groupNonresidentReturn?: boolean;
}

/* Whether California allows a resident's credit for tax paid to this state (General Information C). */
export function residentCreditAllowed(answers: CreditStateAnswers): boolean {
  const state = answers.state.toUpperCase();
  if (state === VIRGINIA && answers.dualResident === true) return true;
  if (RESIDENT_CREDIT_STATES.has(state)) return true;
  return GROUP_RETURN_ONLY_STATES.has(state) && answers.groupNonresidentReturn === true;
}

/*
 * Lines 5 and 10: part divided by whole, "Do not enter more than 1.0000",
 * rounded to four places, half up (QUESTIONS.md). No double-taxed income is 0.
 * A whole at or under the part (a zero or negative AGI included) is 1.0000.
 */
export function incomeRatio(part: number, whole: number): number {
  if (part <= 0) return 0;
  if (whole <= part) return RATIO_LIMIT;
  return roundToPlaces(part / whole, RATIO_PLACES);
}

/* Lines 5 and 10 print one digit, the point, and four places ("0.4167", "1.0000"). */
export function ratioText(ratio: number): string {
  const tenThousandths = roundDollars(ratio * 10 ** RATIO_PLACES);
  const scale = 10 ** RATIO_PLACES;
  const whole = (tenThousandths - (tenThousandths % scale)) / scale;
  return `${whole}.${String(tenThousandths % scale).padStart(RATIO_PLACES, "0")}`;
}

/* One Part I row as printed: whole dollars (the stated item keeps its cents for line 1). */
export interface PartIRow {
  description: string;
  californiaAmount: number;
  otherStateAmount: number;
}

export interface ScheduleSAmounts {
  /* Line 2 before rounding: Form 540 line 48 without this credit. */
  californiaTax: number;
  /* Line 4 before rounding: Form 540 line 17 plus any Schedule G-1 lump sum. */
  californiaAgi: number;
  items: readonly OtherStateTaxItem[];
  taxPaid: number;
  otherStateAdjustedGrossIncome: number;
}

export interface ScheduleSLines {
  rows: PartIRow[];
  line1California: number;
  line1OtherState: number;
  line2: number;
  line3: number;
  line4: number;
  line5: number;
  line6: number;
  line7: number;
  line8: number;
  line9: number;
  line10: number;
  line11: number;
  line12: number;
}

export function partIRows(items: readonly OtherStateTaxItem[]): PartIRow[] {
  return items.map((item) => ({
    description: item.description,
    californiaAmount: roundDollars(item.californiaAmount),
    otherStateAmount: roundDollars(item.otherStateAmount),
  }));
}

export function scheduleSLines(amounts: ScheduleSAmounts): ScheduleSLines {
  const { items } = amounts;
  // Line 1: "Combine the amounts in column (b) and column (c)" (ca-540-sched-s-inst-2025::sec::part-i-double-taxed-income::b02).
  const line1California = roundDollars(sum(...items.map((item) => item.californiaAmount)));
  const line1OtherState = roundDollars(sum(...items.map((item) => item.otherStateAmount)));
  // Line 2: ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01.
  const line2 = roundDollars(amounts.californiaTax);
  const line3 = line1California;
  // Line 4: ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b01.
  const line4 = roundDollars(amounts.californiaAgi);
  const line5 = incomeRatio(line3, line4);
  // Line 6: "Multiply line 2 by line 5" (the form).
  const line6 = roundDollars(line2 * line5);
  // Line 7: ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b02.
  const line7 = roundDollars(amounts.taxPaid);
  const line8 = line1OtherState;
  // Line 9: ca-540-sched-s-inst-2025::sec::part-ii-figure-your-other-state-tax-credit::b02.
  const line9 = roundDollars(amounts.otherStateAdjustedGrossIncome);
  const line10 = incomeRatio(line8, line9);
  // Line 11: "Multiply line 7 by line 10" (the form).
  const line11 = roundDollars(line7 * line10);
  // Line 12: "Enter the smaller of line 6 or line 11" (the form); never below 0.
  const line12 = atLeast(0, Math.min(line6, line11));
  return {
    rows: partIRows(items),
    line1California,
    line1OtherState,
    line2,
    line3,
    line4,
    line5,
    line6,
    line7,
    line8,
    line9,
    line10,
    line11,
    line12,
  };
}
