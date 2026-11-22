import {
  CODES_WITH_DETERMINATION_DATE,
  type UncollectedWagesFactValue,
} from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";

/*
 * Line 7 (printed on the form): the 2025 maximum wages subject to social
 * security tax (irs-8919-form-2025::sec::what-s-new::b01,
 * irs-8919-form-2025::sec::omb-no-1545-0074::b02).
 */
export const SOCIAL_SECURITY_WAGE_BASE = 176_100;
/* Line 11: "Multiply line 10 by 0.062 (social security tax rate)" (omb-no-1545-0074::b03). */
export const SOCIAL_SECURITY_TAX_RATE = 0.062;
/* Line 12: "Multiply line 6 by 0.0145 (Medicare tax rate)" (omb-no-1545-0074::b03). */
export const MEDICARE_TAX_RATE = 0.0145;
/* Lines 1 through 5: five firms; more go on another Form 8919 (lines-1-through-5::b01). */
export const LINE_1_ROW_COUNT = 5;
/* Column (b) when the firm's number cannot be had (lines-1-through-5::b02). */
export const UNKNOWN_FIRM_TIN = "unknown";

/* One firm's row, as the fact states it (column (f) not yet rounded). */
export type FirmRow = Omit<UncollectedWagesFactValue, "owner" | "form1099Keys">;

/* The printed columns of one row. */
export interface RowColumns {
  firmName: string;
  firmTin: string;
  reasonCode: string;
  /* Column (d): only for reason code A or C (lines-1-through-5::b03). */
  determinationDate?: string;
  /* Column (e): checked, or blank. */
  received1099?: true;
  /* Column (f), in whole dollars. */
  wages: number;
}

export function rowColumns(row: FirmRow): RowColumns {
  const tin = row.firmTin.trim();
  return {
    firmName: row.firmName,
    firmTin: tin === "" ? UNKNOWN_FIRM_TIN : tin,
    reasonCode: row.reasonCode,
    determinationDate: CODES_WITH_DETERMINATION_DATE.includes(row.reasonCode)
      ? row.determinationDate
      : undefined,
    received1099: row.received1099 ? true : undefined,
    wages: roundDollars(row.wages),
  };
}

/* A code A or C row with no date: column (d) waits for it. */
export function waitsForDetermination(row: FirmRow): boolean {
  return CODES_WITH_DETERMINATION_DATE.includes(row.reasonCode) && !row.determinationDate;
}

export interface Form8919Lines {
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
 * Line 6: "Combine lines 1 through 5 in column (f)", every firm on every Form
 * 8919 of the person (lines-1-through-5::b01). The rows keep their cents and
 * only the total rounds: "include cents when adding the amounts and round off
 * only the total" (irs-1040-inst-2025::sec::rounding-off-to-whole::b01).
 */
export function totalWages(rows: ReadonlyArray<FirmRow>): number {
  return roundDollars(sum(...rows.map((row) => row.wages)));
}

/*
 * Lines 6 through 13 of one person's Form 8919 (omb-no-1545-0074::b02, b03).
 * socialSecurityWagesAndTips is line 8: W-2 boxes 3 and 7 (cents kept) plus
 * the person's Form 4137 line 10; while it waits, lines 8 through 11 and 13
 * wait too. Line 9 does not go below 0 ("enter -0-"). Lines 11 and 12 round to
 * the nearest dollar.
 */
export function form8919Lines(
  rows: ReadonlyArray<FirmRow>,
  socialSecurityWagesAndTips: number | undefined,
): Form8919Lines {
  const line6 = totalWages(rows);
  const line12 = roundDollars(line6 * MEDICARE_TAX_RATE);
  const base = { line6, line7: SOCIAL_SECURITY_WAGE_BASE, line12 };
  if (socialSecurityWagesAndTips === undefined) return base;
  const line8 = roundDollars(socialSecurityWagesAndTips);
  const line9 = atLeast(0, SOCIAL_SECURITY_WAGE_BASE - line8);
  const line10 = Math.min(line6, line9);
  const line11 = roundDollars(line10 * SOCIAL_SECURITY_TAX_RATE);
  return { ...base, line8, line9, line10, line11, line13: line11 + line12 };
}
