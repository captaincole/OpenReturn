/*
 * Form 8874, New Markets Credit: the arithmetic of lines 1 to 3, pure. An
 * amount is a Form 3800 cell (3800/cells.ts): a number, blank, or a gap that
 * passes through every line that adds it. Dates are YYYY-MM-DD.
 *
 * "A credit is generally allowed to the holder of the qualified equity
 * investment on each of 7 credit allowance dates. The credit allowance dates
 * are the date you make the initial investment and each of the next 6
 * anniversary dates. The credit is equal to the qualified equity investment
 * multiplied by 5% (6% for the fourth through seventh years). However, the
 * credit is not allowed for a credit allowance date if the investment is not a
 * qualified equity investment on that date"
 * (irs-8874-form-2025::sec::how-to-figure-the-credit::b01).
 */

import { roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { addCells, type Cell } from "../3800/cells.js";

export const TAX_YEAR = 2025;

/* "each of 7 credit allowance dates" (how-to-figure-the-credit::b01). */
export const CREDIT_ALLOWANCE_DATES = 7;
/* Column (e): "Enter '5' for the first, second, or third year of the 7-year credit period. For any later year, enter '6'" (specific-instructions::b01). */
export const FIVE_PERCENT_YEARS = 3;
export const EARLY_RATE_PERCENT = 5;
export const LATE_RATE_PERCENT = 6;
const PERCENT = 100;

/* Line 1 prints six rows (the blank form, face-page-1::b01). */
export const LINE_1_ROWS = 6;
/* "On the last row on line 1, write 'See attached' in column (a)" (specific-instructions::b01). */
export const SEE_ATTACHED = "See attached";

const MORE_ROWS_GAP = (count: number) =>
  `${count} qualified equity investments have a 2025 credit allowance date; line 1 prints ${LINE_1_ROWS} rows, and the rest go on an attached statement whose credit total goes in column (f) of the last row ("If you need more space, attach a statement", irs-8874-form-2025::sec::specific-instructions::b01). The engine writes no statements.`;

/*
 * A recapture event in 2025 adds the credit recapture amount to the tax, "on
 * the line for recapture taxes" (Schedule 2 line 17a, "NMCR",
 * irs-1040-inst-2025::sec::line-17a::b01), figured under section 45D(g) from
 * the credits of earlier years with interest (recapture-of-the-credit::b01).
 */
const RECAPTURE_GAP = (cde: string) =>
  `The investment in ${cde} had a recapture event in 2025 (Form 8874-B). The credit recapture amount goes on Schedule 2 line 17a ("NMCR"), figured from the credits of earlier years with interest under section 45D(g) and Regulations section 1.45D-1(e) (irs-8874-form-2025::sec::recapture-of-the-credit::b01); the engine does not figure it.`;

const yearOf = (date: string) => Number(date.slice(0, 4));
const monthDayOf = (date: string) => date.slice(5);
const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const LEAP_DAY = "02-29";
const DAY_BEFORE_LEAP_DAY = "02-28";

/* Which of the 7 credit allowance dates falls in the tax year: 1 is the date of the initial investment. */
export const creditYearOf = (investmentDate: string, taxYear = TAX_YEAR): number =>
  taxYear - yearOf(investmentDate) + 1;

/* True when the tax year holds one of the 7 credit allowance dates. */
export function hasCreditAllowanceDateIn(investmentDate: string, taxYear = TAX_YEAR): boolean {
  const creditYear = creditYearOf(investmentDate, taxYear);
  return creditYear >= 1 && creditYear <= CREDIT_ALLOWANCE_DATES;
}

/*
 * The credit allowance date in the tax year: the date of the initial
 * investment, or its anniversary. A February 29 investment has its anniversary
 * on February 28 in a year with no February 29 (QUESTIONS.md).
 */
export function creditAllowanceDateIn(investmentDate: string, taxYear = TAX_YEAR): string {
  const monthDay = monthDayOf(investmentDate);
  const day = monthDay === LEAP_DAY && !isLeapYear(taxYear) ? DAY_BEFORE_LEAP_DAY : monthDay;
  return `${taxYear}-${day}`;
}

/* Column (e): 5 for credit years 1 to 3, 6 for years 4 to 7 (specific-instructions::b01). */
export const ratePercentOf = (creditYear: number): number =>
  creditYear <= FIVE_PERCENT_YEARS ? EARLY_RATE_PERCENT : LATE_RATE_PERCENT;

/* Column (f): "Credit ((d) × (e))" (face-page-1::b01), on column (d) in whole dollars. */
export const creditOf = (amount: number, ratePercent: number): number =>
  roundDollars((amount * ratePercent) / PERCENT);

/* One qualified equity investment as Form 8874 reads it. */
export interface NewMarketsInvestment {
  key: string;
  cdeName: string;
  cdeAddress?: string;
  cdeEin: string;
  /* Column (c): the date of the initial investment. */
  investmentDate: string;
  /* Column (d): the amount paid at original issue, cents kept. */
  amount: number;
  disposedOn?: string;
  recaptureEventOn?: string;
  passive?: boolean;
}

/* One row of line 1: the investment's columns, or the "See attached" row. */
export interface Line1Row {
  /* The fact the row comes from; undefined on the "See attached" row. */
  key?: string;
  /* Column (a). */
  nameAndAddress: string;
  /* Column (b). */
  ein?: string;
  /* Column (c). */
  investmentDate?: string;
  /* Column (d), whole dollars. */
  amount?: number;
  /* Column (e): 5 or 6. */
  ratePercent?: number;
  /* Column (f). */
  credit: Cell;
}

export interface Form8874Lines {
  /* Line 1: at most six rows. */
  rows: Line1Row[];
  /* Every investment with a row, in order, also the ones an attached statement would hold. */
  investments: Array<Line1Row & { key: string }>;
  /* Line 2: the credit from partnerships and S corporations; blank with none. */
  line2: Cell;
  /* Line 3: "Add lines 1 and 2". */
  line3: Cell;
}

const nameAndAddressOf = (investment: NewMarketsInvestment) =>
  investment.cdeAddress ? `${investment.cdeName}, ${investment.cdeAddress}` : investment.cdeName;

/*
 * The investment's row, or undefined when it has no credit allowance date in
 * the tax year while it is a qualified equity investment held by the taxpayer:
 * line 1 takes "each qualified equity investment held directly by you on a
 * credit allowance date in the current tax year" (specific-instructions::b01).
 * - Sold before the date: "you cannot claim the credit for any credit allowance
 *   date after the disposition" (recapture-of-the-credit::b02).
 * - A recapture event before the tax year: the investment stopped being a
 *   qualified equity investment then (recapture-of-the-credit::b01). One in the
 *   tax year keeps its row, with the gap of the recapture amount.
 */
export function rowOf(investment: NewMarketsInvestment, taxYear = TAX_YEAR): Line1Row | undefined {
  const { investmentDate, disposedOn, recaptureEventOn } = investment;
  if (!hasCreditAllowanceDateIn(investmentDate, taxYear)) return undefined;
  if (disposedOn !== undefined && yearOf(disposedOn) < taxYear) return undefined;
  if (recaptureEventOn !== undefined && yearOf(recaptureEventOn) < taxYear) return undefined;
  const amount = roundDollars(investment.amount);
  const ratePercent = ratePercentOf(creditYearOf(investmentDate, taxYear));
  const columns = {
    key: investment.key,
    nameAndAddress: nameAndAddressOf(investment),
    ein: investment.cdeEin,
    investmentDate,
    amount,
    ratePercent,
  };
  if (recaptureEventOn !== undefined && yearOf(recaptureEventOn) === taxYear) {
    return { ...columns, credit: unsupported(RECAPTURE_GAP(investment.cdeName)) };
  }
  const allowanceDate = creditAllowanceDateIn(investmentDate, taxYear);
  if (disposedOn !== undefined && disposedOn < allowanceDate) return undefined;
  return { ...columns, credit: creditOf(amount, ratePercent) };
}

/* Line 1's printed rows: six investments, or five and the "See attached" row with its gap. */
export function line1RowsOf(investments: ReadonlyArray<Line1Row>): Line1Row[] {
  if (investments.length <= LINE_1_ROWS) return [...investments];
  const attached: Line1Row = {
    nameAndAddress: SEE_ATTACHED,
    credit: unsupported(MORE_ROWS_GAP(investments.length)),
  };
  return [...investments.slice(0, LINE_1_ROWS - 1), attached];
}

/* Line 3: "Add lines 1 and 2" (face-page-1::b01); blank when both are blank. */
export const line3Of = (rows: ReadonlyArray<Line1Row>, line2: Cell): Cell =>
  addCells(...rows.map((row) => row.credit), line2);

/* Lines 1 to 3 from the investments and line 2. */
export function form8874LinesOf(
  investments: ReadonlyArray<NewMarketsInvestment>,
  line2: Cell,
  taxYear = TAX_YEAR,
): Form8874Lines {
  const withRow = investments.flatMap((investment) => {
    const row = rowOf(investment, taxYear);
    return row === undefined ? [] : [{ ...row, key: investment.key }];
  });
  const rows = line1RowsOf(withRow);
  return { rows, investments: withRow, line2, line3: line3Of(rows, line2) };
}
