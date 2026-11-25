/*
 * Schedule D (540) for a full-year resident: the California capital gain or loss
 * from each sale's California basis, the capital gain distributions and the
 * California carryover, against the federal Form 1040 line 7a
 * (ca-540-sched-d-inst-2025). Each row prints its rounded columns (b) and (c);
 * columns (d) and (e) use the rounded amounts, and the totals add the printed
 * rows. Lines 5, 6, 7 and 9 print in parentheses, so they are positive here.
 */

import { roundDollars, sum, sumOrBlank } from "../../../money.js";
import type { FilingStatus } from "../../../values.js";

/* ca-540-sched-d-inst-2025::sec::line-9::b01: the loss limit, and the limit for a separate return. */
export const LOSS_LIMIT = 3000;
export const LOSS_LIMIT_SEPARATE = 1500;

/* Line 1 has rows a through v. */
export const LINE_1_ROWS = 22;

export const ADJUSTED_SALE_GAP =
  "A sale has a federal Form 8949 column (g) adjustment; the engine models the adjustment on neither return, so it cannot carry it into column (c).";

export const MORE_ROWS_GAP =
  "The return has more than 22 capital asset sales; line 1 has 22 rows and the instructions name no attached statement, so the engine prints no row.";

export interface CaliforniaSale {
  description: string;
  salesPrice: number;
  /* Column (c): the California basis; undefined while the federal basis waits. */
  basis: number | undefined;
  /* The sale has a federal Form 8949 column (g) adjustment. */
  adjusted: boolean;
}

/*
 * An FTB 3805E capital asset gain (line 26, plus line 37): "Enter this amount on
 * Schedule D (540 or 540NR), line 1" (ca-3805e-inst-2025::sec::line-26-and-line-37::b01).
 * The gain is undefined while the form waits or has a gap.
 */
export interface InstallmentRow {
  description: string;
  gain: number | undefined;
  gap: string | undefined;
}

export interface Line1Row {
  description: string;
  /* Blank on an FTB 3805E row and on the Schedule D-1 row, which carry only a gain. */
  salesPrice: number | undefined;
  basis: number | undefined;
  /* Column (d) when (c) is more than (b); column (e) when (b) is more than (c). */
  loss: number | undefined;
  gain: number | undefined;
  gap: string | undefined;
  /*
   * The row waits for an answer (a basis, or the FTB 3805E amount): the totals
   * wait. The Schedule D-1 row never waits; section1231Waits holds its answer.
   */
  waits: boolean;
}

export interface ScheduleDCaInputs {
  sales: CaliforniaSale[];
  /* FTB 3805E rows, after the sales. Absent: none. */
  installmentRows?: InstallmentRow[];
  /* 1099-DIV box 2a, all payers. */
  capitalGainDistributions: number | undefined;
  /* Line 6, positive. */
  californiaCarryover: number | undefined;
  /* Line 6 waits for the taxpayer's answer: lines 7 to 11 wait with it. */
  californiaCarryoverMissing: boolean;
  filingStatus: FilingStatus | undefined;
  /* California's section 1231 gain from Schedule D-1 line 7 or 9; undefined when none. */
  section1231Gain?: number;
  /* The Schedule D-1 gain waits for its line 8 answer: the totals wait with it. */
  section1231Waits?: boolean;
  /* Why the Schedule D-1 gain is not figured: the totals are a gap. */
  section1231Gap?: string;
}

/* The Schedule D-1 row of line 1: its gain in column (e). */
export const SECTION_1231_ROW = "Schedule D-1, net section 1231 gain";

/*
 * "Forms 540 and 540NR filers, enter the gain on Schedule D (540 or 540NR), line
 * 1" (Schedule D-1, the text under lines 7 and 9). The gain is already net of its
 * basis, so columns (b) to (d) stay blank.
 */
export function section1231Row(gain: number): Line1Row {
  return {
    description: SECTION_1231_ROW,
    salesPrice: undefined,
    basis: undefined,
    loss: undefined,
    gain,
    gap: undefined,
    waits: false,
  };
}

export interface ScheduleDCaFigures {
  gap: string | undefined;
  line1: Line1Row[];
  line3: number | undefined;
  line4: number | undefined;
  line5: number | undefined;
  line6: number | undefined;
  line7: number | undefined;
  line8: number | undefined;
  line9: number | undefined;
  line11: number | undefined;
}

/* ca-540-sched-d-inst-2025::sec::line-1::b01: one row per sale, (d) or (e) from (b) and (c). */
export function line1Row(sale: CaliforniaSale): Line1Row {
  const salesPrice = roundDollars(sale.salesPrice);
  const basis = roundDollars(sale.basis);
  return {
    description: sale.description,
    salesPrice,
    basis,
    loss: basis !== undefined && basis > salesPrice ? basis - salesPrice : undefined,
    gain: basis !== undefined && salesPrice > basis ? salesPrice - basis : undefined,
    gap: sale.adjusted ? ADJUSTED_SALE_GAP : undefined,
    waits: basis === undefined,
  };
}

/*
 * An FTB 3805E row: column (e) takes the gain; columns (b) and (c) stay blank,
 * because line 26 is already the gain (QUESTIONS.md of FTB 3805E).
 */
export function installmentLine1Row(row: InstallmentRow): Line1Row {
  return {
    description: row.description,
    salesPrice: undefined,
    basis: undefined,
    loss: undefined,
    gain: row.gain,
    gap: row.gap,
    waits: row.gain === undefined && row.gap === undefined,
  };
}

/*
 * Line 8 (ca-540-sched-d-inst-2025::sec::line-8-net-gain-or-loss::b01): line 4
 * less line 7, a gain when line 4 is more, a negative number when line 7 is more.
 */
export function netGainOrLoss(line4: number | undefined, line7: number | undefined): number {
  return sum(line4) - sum(line7);
}

/* Line 9 (::line-9::b01): the smaller of the loss and $3,000 ($1,500 married/RDP filing separately). */
export function allowedLoss(
  line8: number,
  filingStatus: FilingStatus | undefined,
): number | undefined {
  if (line8 >= 0 || filingStatus === undefined) return undefined;
  const limit = filingStatus === "married_filing_separately" ? LOSS_LIMIT_SEPARATE : LOSS_LIMIT;
  return Math.min(-line8, limit);
}

/* Line 11: the gain on line 8, or the loss on line 9 as a negative number. */
export function californiaGainOrLoss(line8: number, line9: number | undefined): number | undefined {
  if (line8 >= 0) return line8;
  return line9 === undefined ? undefined : -line9;
}

/*
 * Lines 12a and 12b (::line-12a::b01, ::line-12b::b01): line 10 more than line 11
 * is 12a (Schedule CA line 7a column B); less is 12b (column C). Equal amounts
 * fill neither: each line's condition is "more than" or "less than".
 */
export function adjustment(
  line10: number,
  line11: number,
): { line12a: number | undefined; line12b: number | undefined } {
  return {
    line12a: line10 > line11 ? line10 - line11 : undefined,
    line12b: line10 < line11 ? line11 - line10 : undefined,
  };
}

/* Lines 1 to 9 and 11. Line 2 stays blank: the engine has no K-1 fact. */
export function scheduleDCaFigures(inputs: ScheduleDCaInputs): ScheduleDCaFigures {
  // The sales, then the FTB 3805E rows, then the Schedule D-1 row.
  const gain = inputs.section1231Gain;
  const line1 = [
    ...inputs.sales.map(line1Row),
    ...(inputs.installmentRows ?? []).map(installmentLine1Row),
    ...(gain !== undefined && gain > 0 ? [section1231Row(gain)] : []),
  ];
  const gap = line1.find((row) => row.gap !== undefined)?.gap ?? inputs.section1231Gap;
  const line3 = roundDollars(inputs.capitalGainDistributions);
  const line6 = roundDollars(inputs.californiaCarryover);
  const rowsWait = line1.some((row) => row.waits) || inputs.section1231Waits === true;
  const line4 = rowsWait ? undefined : sumOrBlank(...line1.map((row) => row.gain), line3);
  const line5 = rowsWait ? undefined : sumOrBlank(...line1.map((row) => row.loss));
  const waiting = rowsWait || inputs.californiaCarryoverMissing;
  const line7 = waiting ? undefined : sumOrBlank(line5, line6);
  const line8 = waiting ? undefined : netGainOrLoss(line4, line7);
  const line9 = line8 === undefined ? undefined : allowedLoss(line8, inputs.filingStatus);
  const line11 = line8 === undefined ? undefined : californiaGainOrLoss(line8, line9);
  return { gap, line1, line3, line4, line5, line6, line7, line8, line9, line11 };
}
