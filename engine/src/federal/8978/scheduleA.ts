/*
 * Schedule A (Form 8978): each Form 8986 adjustment and each partner-level
 * amount, sorted into line 1 (income), line 3 (deductions) or line 5
 * (credits), and the column totals of lines 2, 4 and 6 that go to Form 8978
 * lines 1b, 3b and 9b (irs-8978-inst-2025::sec::completing-form-8978-and-schedule-a::b01).
 * The engine has no catalog for Schedule A, so it is figured here and not
 * printed (QUESTIONS.md).
 */

import type {
  Form8986Adjustment,
  Form8986ReturnType,
  PartnerAttributeAdjustment,
  ScheduleALine,
} from "../../facts/index.js";
import { sum } from "../../money.js";

/*
 * Where a Form 8986 row goes, by its Schedule K-1 line number. "none": the
 * row does not by itself change taxable income, so it enters with a zero
 * amount, and its effect on a tax attribute is a partner-level amount
 * (::specific-instructions-for-schedule-a::b01, the Schedule K-3 note). A
 * line that is part of another line (qualified dividends, the 28% and
 * section 1250 parts of a long-term gain, the total of guaranteed payments)
 * is "none" too, so the amount counts once; its tax rate is in the
 * statement's line 6.
 */
export type RowPlace = ScheduleALine | "none";

const INCOME: RowPlace = "income";
const DEDUCTIONS: RowPlace = "deductions";
const CREDITS: RowPlace = "credits";
const NONE: RowPlace = "none";

/*
 * Schedule K-1 (Form 1065): lines 1–11 are income
 * (::line-1-income-enter-all-the-adjustments-individually-from::b01: "ordinary
 * income, rental income, interest income, dividends, royalties, gains and
 * losses, and other income"), 12 and 13 deductions
 * (::line-3-deductions-enter-all-the-adjustments-individually::b01: "separately
 * stated items such as a section 179 deduction"), 15 credits.
 */
const PARTNERSHIP_LINES: Readonly<Record<string, RowPlace>> = {
  "1": INCOME,
  "2": INCOME,
  "3": INCOME,
  "4a": INCOME,
  "4b": INCOME,
  "4c": NONE,
  "5": INCOME,
  "6a": INCOME,
  "6b": NONE,
  "6c": INCOME,
  "7": INCOME,
  "8": INCOME,
  "9a": INCOME,
  "9b": NONE,
  "9c": NONE,
  "10": INCOME,
  "11": INCOME,
  "12": DEDUCTIONS,
  "13": DEDUCTIONS,
  "14": NONE,
  "15": CREDITS,
  "16": NONE,
  "17": NONE,
  "18": NONE,
  "19": NONE,
  "20": NONE,
  "21": NONE,
  "22": NONE,
  "23": NONE,
  K3: NONE,
};

/* Schedule K-1 (Form 1120-S), for a statement an S corporation pass-through partner submits. */
const S_CORPORATION_LINES: Readonly<Record<string, RowPlace>> = {
  "1": INCOME,
  "2": INCOME,
  "3": INCOME,
  "4": INCOME,
  "5a": INCOME,
  "5b": NONE,
  "6": INCOME,
  "7": INCOME,
  "8a": INCOME,
  "8b": NONE,
  "8c": NONE,
  "9": INCOME,
  "10": INCOME,
  "11": DEDUCTIONS,
  "12": DEDUCTIONS,
  "13": CREDITS,
  "14": NONE,
  "15": NONE,
  "16": NONE,
  "17": NONE,
  K3: NONE,
};

const TABLES: Partial<Record<Form8986ReturnType, Readonly<Record<string, RowPlace>>>> = {
  "1065": PARTNERSHIP_LINES,
  "1120-S": S_CORPORATION_LINES,
};

/* The place of a row, or undefined when the engine has no table for the return type or the line. */
export function rowPlace(
  returnType: Form8986ReturnType,
  row: Form8986Adjustment,
): RowPlace | undefined {
  const table = TABLES[returnType];
  if (table === undefined) return undefined;
  return table[
    row.lineNumber.trim().toUpperCase() === "K3" ? "K3" : row.lineNumber.trim().toLowerCase()
  ];
}

/* One Schedule A column: the line 2, 4 and 6 totals, cents kept until the form rounds them. */
export interface ScheduleAColumn {
  income: number;
  deductions: number;
  credits: number;
}

export const EMPTY_COLUMN: ScheduleAColumn = { income: 0, deductions: 0, credits: 0 };

/* An amount placed in a Schedule A part. */
export interface PlacedAmount {
  place: RowPlace;
  amount: number;
}

/*
 * Lines 2, 4 and 6: the total of each part ("Enter the total of all
 * adjustments from line 1", ::line-2-total-adjustments-to-income-enter-the-total-of-all::b01,
 * and the line 4 and 6 blocks). A "none" row adds 0.
 */
export function scheduleAColumn(amounts: ReadonlyArray<PlacedAmount>): ScheduleAColumn {
  const of = (place: RowPlace) =>
    sum(...amounts.filter((each) => each.place === place).map((each) => each.amount));
  return { income: of(INCOME), deductions: of(DEDUCTIONS), credits: of(CREDITS) };
}

/*
 * A Form 8986 row on Schedule A, signed as the form prints it: "All
 * adjustments (positive and negative) from a Form 8986 should be shown as
 * reported on that form" (::specific-instructions-for-schedule-a::b02).
 *
 * DECISION (2026-11-25, by the author): which Part V column of Form 8986
 * holds the amount.
 * - The Form 8978 instructions (Rev. December 2024): "enter amounts from Form
 *   8986, Part V, column (h), which reflect the adjustments net of any
 *   approved modifications (column (g) of Form 8986)"
 *   (irs-8978-inst-2025::sec::specific-instructions-for-schedule-a::b02).
 * - Form 8986 (Rev. December 2024), Part V: column (g) "Reviewed year
 *   adjustments net of approved modifications", column (h) "As corrected
 *   (column (d) combined with column (g))" (the form; not in the corpus).
 * The engine takes column (g), the adjustment net of modifications: the
 * sentence names the amount by its meaning, and its letters are those of the
 * earlier Form 8986, whose (h) was that net amount; column (h) of the current
 * form would add back the amount already reported.
 */
export const placedRow = (place: RowPlace, row: Form8986Adjustment): PlacedAmount => ({
  place,
  amount: row.netAdjustment,
});

export const placedAttribute = (adjustment: PartnerAttributeAdjustment): PlacedAmount => ({
  place: adjustment.line,
  amount: adjustment.amount,
});
