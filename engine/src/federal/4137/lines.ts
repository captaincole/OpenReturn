import type { TipsFactValue, W2FactValue } from "../../facts/index.js";
import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";

/*
 * Line 7 (printed on the form): the 2025 maximum wages and tips subject to
 * social security tax (irs-4137-form-2025::sec::what-s-new::b01,
 * irs-4137-form-2025::sec::omb-no-1545-0074::b02).
 */
export const SOCIAL_SECURITY_WAGE_BASE = 176_100;
/* Line 11: "Multiply line 10 by 0.062 (social security tax rate)" (omb-no-1545-0074::b02). */
export const SOCIAL_SECURITY_TAX_RATE = 0.062;
/* Line 12: "Multiply line 6 by 0.0145 (Medicare tax rate)" (omb-no-1545-0074::b02). */
export const MEDICARE_TAX_RATE = 0.0145;
/* Line 1 prints rows A through E; a sixth employer goes on a statement (line-1::b01). */
export const LINE_1_ROW_COUNT = 5;

/* One employer's tips, as line 1 and lines 5 and 10 need them (amounts not yet rounded). */
export interface TipRow {
  employerName: string;
  employerEin: string;
  /* Column (c). */
  received: number;
  /* Column (d). */
  reported: number;
  /* Line 5: tips in months under $20, not reported. */
  under20?: number;
  /* Line 10: government-employee tips that owed only the 1.45% Medicare tax. */
  medicareOnly?: number;
  /* Form 1040 line 1c only. */
  noncash?: number;
}

/* A tip record from the taxpayer's daily tip record. */
export function tipRowFromRecord(value: TipsFactValue): TipRow {
  return {
    employerName: value.employerName,
    employerEin: value.employerEin,
    received: value.tipsReceived,
    reported: value.tipsReported,
    under20: value.tipsUnder20InAMonth,
    medicareOnly: value.medicareOnlyGovernmentTips,
    noncash: value.noncashTips,
  };
}

/*
 * A W-2 with allocated tips and no tip record. Column (c) includes the box 8
 * allocated tips "unless you can prove that your unreported tips are less than
 * the amount in box 8" (irs-4137-form-2025::sec::line-1::b02; what-s-new::b03).
 * Column (d) is box 7, the tips the employee reported
 * (irs-w2w3-inst-2025::sec::specific-instructions-for-form-w-2::b17).
 */
export function allocatedTipsRow(w2: W2FactValue): TipRow {
  return {
    employerName: w2.employerName,
    employerEin: w2.employerEin,
    received: sum(w2.box7, w2.box8),
    reported: sum(w2.box7),
  };
}

/* Columns (c) and (d) of one row, in whole dollars. */
export function rowColumns(row: TipRow): { received: number; reported: number } {
  return { received: roundDollars(row.received), reported: roundDollars(row.reported) };
}

export interface Form4137Lines {
  line2: number;
  line3: number;
  line4: number;
  line5?: number;
  line6: number;
  line7: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12: number;
  line13?: number;
}

/*
 * Lines 2 through 6 (omb-no-1545-0074::b01, b02): line 2 adds column (c), line 3
 * column (d). Each row prints in whole dollars, but the sums keep the rows'
 * cents and round only the total: "include cents when adding the amounts and
 * round off only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 * Line 4 subtracts the rounded lines 2 and 3 (QUESTIONS.md item 9). Line 4 is
 * the unreported tips, line 5 the part from months under $20 (line-5::b01),
 * line 6 the rest. Lines 4 and 6 do not go below 0: column (c) holds every tip
 * of columns (d) and line 5, so a negative result means the record is wrong.
 */
function medicareLines(rows: ReadonlyArray<TipRow>) {
  const line2 = roundDollars(sum(...rows.map((row) => row.received)));
  const line3 = roundDollars(sum(...rows.map((row) => row.reported)));
  const line4 = atLeast(0, line2 - line3);
  const under20 = sumOrBlank(...rows.map((row) => row.under20));
  const line5 = under20 === undefined ? undefined : roundDollars(under20);
  const line6 = atLeast(0, line4 - sum(line5));
  return { line2, line3, line4, line5, line6 };
}

/*
 * Line 10: the smaller of line 6 or line 9. Government-employee tips that owed
 * only the 1.45% Medicare tax come off line 6 "only for the purpose of
 * comparing lines 6 and 9" (irs-4137-form-2025::sec::line-10::b01).
 */
export function line10Of(line6: number, line9: number, rows: ReadonlyArray<TipRow>): number {
  const medicareOnly = roundDollars(sum(...rows.map((row) => row.medicareOnly)));
  return Math.min(atLeast(0, line6 - medicareOnly), line9);
}

/*
 * Lines 2 through 13 of one person's Form 4137, from every row (also rows the
 * form has no room for). Line 8 is the person's W-2 boxes 3 and 7 (a document
 * sum: cents kept, the total rounded); while it waits, lines 8 through 11 and
 * 13 wait too. Lines 11 and 12 round to the nearest dollar.
 */
export function form4137Lines(
  rows: ReadonlyArray<TipRow>,
  socialSecurityWagesAndTips: number | undefined,
): Form4137Lines {
  const medicare = medicareLines(rows);
  const line12 = roundDollars(medicare.line6 * MEDICARE_TAX_RATE);
  const base = { ...medicare, line7: SOCIAL_SECURITY_WAGE_BASE, line12 };
  if (socialSecurityWagesAndTips === undefined) return base;
  const line8 = roundDollars(socialSecurityWagesAndTips);
  const line9 = atLeast(0, SOCIAL_SECURITY_WAGE_BASE - line8);
  const line10 = line10Of(medicare.line6, line9, rows);
  const line11 = roundDollars(line10 * SOCIAL_SECURITY_TAX_RATE);
  return { ...base, line8, line9, line10, line11, line13: line11 + line12 };
}

/* Line 6 of these rows: the unreported tips that owe Medicare tax (who must file). */
export function tipsSubjectToMedicare(rows: ReadonlyArray<TipRow>): number {
  return medicareLines(rows).line6;
}

/*
 * Form 1040 line 1c: the tips not reported to an employer (line 4 of these
 * rows, which includes allocated tips and tips in months under $20) and the
 * noncash tips (irs-1040-inst-2025::sec::line-1c::b01). Blank when there is
 * none: with no rows, or when every tip was reported (it is already in line 1a).
 */
export function tipIncomeNotOnLine1a(rows: ReadonlyArray<TipRow>): number | undefined {
  if (rows.length === 0) return undefined;
  const noncash = sumOrBlank(...rows.map((row) => row.noncash));
  const total = medicareLines(rows).line4 + (noncash === undefined ? 0 : roundDollars(noncash));
  return total > 0 ? total : undefined;
}
