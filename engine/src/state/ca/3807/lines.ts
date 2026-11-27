/*
 * FTB 3807, the LAMBRA deduction and credit summary: the arithmetic, pure.
 * Written by hand from ca-3807-booklet-2025 for an individual on Form 540.
 * Worksheet I (the LAMBRA share and the LAMBRA business income), Worksheet II
 * (the NOL carryover deduction) and Schedule Z (the credit carryover limits).
 * The booklet's examples with numbers are unit tests (.scratch evidence).
 */

import { atLeast, roundDollars, sum, wholePart } from "../../../money.js";

/* "Use credit code 198 to claim the LAMBRA hiring credit and sales or use tax credit carryover" (ca-3807-booklet-2025::sec::schedule-z-computation-of-credit-carryover-limitations::b05). */
export const LAMBRA_CREDIT_CODE = "198";
/*
 * The Credit Table names code 198 twice: "Local Agency Military Base Recovery
 * Area Hiring" and "... Sales or Use Tax" (ca-540-sched-p-inst-2025::sec::credit-table::b06).
 * One line holds both ("Do not enter the same credit code or name on more than
 * one line within a section", ::to-complete-part-iii::b01), so the line takes
 * the booklet's short name.
 */
export const LAMBRA_CREDIT_NAME = "LAMBRA";

/*
 * The $5,000,000 limit on business credits for 2024 to 2026: business credits
 * "may not reduce the 'net tax' ... by more than $5,000,000"
 * (ca-3807-booklet-2025::sec::general-information::b02).
 */
export const BUSINESS_CREDIT_LIMIT = 5_000_000;

/* Worksheet I, Section A line 4 when the business is wholly within the former LAMBRA: "100 percent (1.00)". */
export const WHOLLY_WITHIN_LAMBRA = 1;

/*
 * The places each factor and the average apportionment percentage keep. The
 * booklet's combined report example prints 800,000 ÷ 1,200,000 as 66.66%, the
 * average as 73.33%, and multiplies $250,000 by it to get $183,325
 * (ca-3807-booklet-2025::sec::corporations-filing-a-combined-report::b03): two
 * decimals of a percent, four places, with the digits after them dropped
 * (66.666…% is 66.66%, not 66.67%). QUESTIONS.md item 7.
 */
export const PERCENTAGE_PLACES = 4;

/* The small tolerance absorbs float error only (0.29 × 10,000 is 2,899.9999999999995). */
const FLOAT_TOLERANCE = 1e-9;
const PERCENTAGE_SCALE = 10 ** PERCENTAGE_PLACES;

/* A percentage of Section A cut to four places, as the booklet's example prints it. */
const toFourPlaces = (share: number): number =>
  wholePart(share * PERCENTAGE_SCALE + FLOAT_TOLERANCE) / PERCENTAGE_SCALE;

/* One factor of Section A: the California total (column (a)) and the LAMBRA total (column (b)). */
export interface Factor {
  california: number;
  lambra: number;
}

/*
 * Worksheet I, Section A line 4: "Average apportionment percentage (1/2 of
 * line 3)", where line 3 adds each factor's column (c), "column (b) ÷ column
 * (a)". "Factors with zero balances in the totals of column (a) will not be
 * included": with no payroll the line divides by one
 * (ca-3807-booklet-2025::sec::payroll-factor-2::b03). A factor is never above
 * 1. With no factor at all the share is 0. Each column (c) percentage and
 * the average keep four places (PERCENTAGE_PLACES).
 */
export function averageApportionment(factors: readonly Factor[]): number {
  const counted = factors.filter((factor) => factor.california > 0);
  if (counted.length === 0) return 0;
  const shares = counted.map((factor) =>
    toFourPlaces(Math.min(1, atLeast(0, factor.lambra) / factor.california)),
  );
  return toFourPlaces(sum(...shares) / counted.length);
}

/* One row of Worksheet I, Section B: column (a) times column (b), with cents. */
export const apportioned = (amount: number, percentage: number): number => amount * percentage;

/*
 * Worksheet I, Section B line 14: "Add line 3, line 10, and line 13, column
 * (c), and line 5, column (b)" (::located-within-and-outside-the-former-lambra-and-california::b08):
 * every row's apportioned amount. The cents are kept while adding and only the
 * total is rounded (CLAUDE.md, document sums). The booklet's example: $156,000
 * (ca-3807-booklet-2025::sec::example-determination-of-lambra-business-income-for-shareholders-partners-or-members-of-pass-through-entities::b02).
 */
export const lambraBusinessIncome = (apportionedRows: readonly number[]): number =>
  roundDollars(sum(...apportionedRows));

/*
 * Worksheet II line 6, the modified taxable income: Form 540 filers enter line
 * 14 "on line 1 and line 6 (skip line 2 through line 5)", and line 4 "If zero
 * or less, enter -0- on line 6"
 * (ca-3807-booklet-2025::sec::instructions-for-worksheet-ii-computation-of-nol-carryover-and-carryover-limitations::b05, ::b06).
 */
export const modifiedTaxableIncome = (line14: number): number => atLeast(0, line14);

/* One row of Worksheet II, lines 8a to 8m. */
export interface NolRowFigures {
  yearOfLoss: number;
  /* Column (b): the carryover from last year. */
  carryover: number;
  /* Column (c): the amount deducted this year. */
  deducted: number;
  /* Column (d): the balance left to offset losses. */
  balance: number;
  /* Column (e): the carryover to future years. */
  future: number;
}

export interface WorksheetII {
  rows: NolRowFigures[];
  /* Line 9 column (b): FTB 3807 line 3a. */
  totalCarryover: number;
  /* Line 9 column (c): FTB 3807 line 3b, the deduction. */
  totalDeducted: number;
  /* Line 9 column (e): FTB 3807 line 3c. */
  totalFuture: number;
}

/*
 * Worksheet II lines 7 to 9 (::b02 to ::b04): oldest loss first, "In column
 * (c), enter the smaller of the amount in column (b) or the amount in column
 * (d) from the previous line"; column (d) is the previous balance less column
 * (c); column (e) is column (b) less column (c). While the deduction is
 * suspended, "do not put any amounts in column (c). Carryover the column (b)
 * amount(s) to column (e)". The booklet's example: $500 of carryover against a
 * $5,000 balance is all deducted, $4,500 left (::b03).
 */
export function worksheetII(
  mti: number,
  carryovers: ReadonlyArray<{ yearOfLoss: number; carryover: number }>,
  suspended: boolean,
): WorksheetII {
  const ordered = [...carryovers].sort((left, right) => left.yearOfLoss - right.yearOfLoss);
  let balance = mti;
  const rows = ordered.map(({ yearOfLoss, carryover }) => {
    const amount = roundDollars(atLeast(0, carryover));
    const deducted = suspended ? 0 : Math.min(amount, balance);
    balance -= deducted;
    return { yearOfLoss, carryover: amount, deducted, balance, future: amount - deducted };
  });
  return {
    rows,
    totalCarryover: sum(...rows.map((row) => row.carryover)),
    totalDeducted: sum(...rows.map((row) => row.deducted)),
    totalFuture: sum(...rows.map((row) => row.future)),
  };
}

export interface ScheduleZPartI {
  line1: number;
  line3: number;
  line4: number;
  line5: number;
  line6a: number;
  line6b: number;
  line7: number;
}

/*
 * Schedule Z, Part I for an individual. Line 1: "Individuals: Enter the amount
 * from Worksheet I, Section B, line 14, column (c) on this line and on line 3
 * (skip line 2)" (the form). A line 14 of zero or less leaves no LAMBRA
 * business income, and no carryover can be used
 * (::located-within-and-outside-the-former-lambra-and-california::b03), so
 * line 1 is 0. Line 4 is the NOL deduction, line 5 "Subtract line 4 from line
 * 3", line 6a the tax on line 5 "as if the former LAMBRA taxable income
 * represented all of your taxable income"
 * (::part-i-computation-of-credit-limitations::b02), line 6b Form 540 line 35,
 * and line 7 "the smaller of line 6a or line 6b" (the form). `taxOn` is the
 * tax table or rate schedule for the filing status (::individuals::b01).
 */
export function scheduleZPartI(
  line14: number,
  nolDeduction: number,
  form540Line35: number,
  taxOn: (amount: number) => number,
): ScheduleZPartI {
  const line1 = atLeast(0, line14);
  const line3 = line1;
  const line5 = atLeast(0, line3 - nolDeduction);
  const line6a = taxOn(line5);
  return {
    line1,
    line3,
    line4: nolDeduction,
    line5,
    line6a,
    line6b: form540Line35,
    line7: Math.min(line6a, form540Line35),
  };
}

/*
 * The LAMBRA credit Schedule P (540) Section A2 offers, column (a): the
 * credits limited by line 7, the hiring credit first (line 9A column (e) is
 * line 8A column (e) less what line 8B column (e) used). Each credit is "never
 * greater than col. (d) or col. (e)" (the form), so the pair is the smaller of
 * line 7 and the two carryovers.
 *
 * DECISION (2026-11-26, by the author): Schedule P (540) column (a) holds the
 * LAMBRA credit after the Schedule Z line 7 limit, not the whole carryover.
 * - Schedule P (540): column (a) is "the amount of credit available to offset
 *   tax", column (b) "the smaller of the amount in column (a) or the amount in
 *   column (c) from the previous line", and column (d) the carryover, column
 *   (a) less column (b) (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * - FTB 3807: "The amount of credit carryover you can claim on your California
 *   tax return is limited by the amount of tax attributable to LAMBRA business
 *   income" (ca-3807-booklet-2025::sec::schedule-z-computation-of-credit-carryover-limitations::b01),
 *   and line 9B column (g) "includes both the Schedule P ... limitation and the
 *   limitation based on LAMBRA business income"
 *   (::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b04),
 *   which Schedule P column (d) equals only when column (a) is the whole carryover.
 * The engine follows the column arithmetic: with the whole carryover in column
 * (a), column (b) could pass line 7 and use credit the LAMBRA limit forbids.
 * Schedule P column (d) then holds only the part Schedule P limits; FTB 3807
 * line 9B column (g) holds the whole carryover. FTB 3801-CR's passive credits
 * enter Schedule P the same way, after their own limit.
 */
export const creditOffered = (line7: number, hiring: number, salesUse: number): number =>
  Math.min(atLeast(0, line7), atLeast(0, hiring) + atLeast(0, salesUse));

export interface ScheduleZPartII {
  line8Ae: number;
  line8Af: number;
  line8Bb: number;
  line8Bd: number;
  line8Be: number;
  line8Bg: number;
  line9Ae: number;
  line9Af: number;
  line9Bb: number;
  line9Bd: number;
  line9Be: number;
  line9Bg: number;
}

/*
 * Schedule Z, Part II (ca-3807-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01 to ::b04).
 * `used` is the LAMBRA credit Schedule P (540) column (b) lets the return
 * take: the hiring credit takes it first, the sales or use tax credit the rest.
 * - 8A (e): line 7. 8A (f): the hiring credit used, never above 8A (e) or 8B (d).
 * - 8B (d): column (b) less column (c); an individual leaves (c) blank.
 * - 8B (e): the smaller of 8A (e) and 8A (f). 8B (g): 8B (d) less 8B (e).
 * - 9A (e): 8A (e) less 8B (e). 9A (f): the sales or use tax credit used.
 * - 9B (e): the smaller of 9A (e) and 9A (f). 9B (g): 9B (d) less 9B (e).
 * The booklet's example: line 7 $7,000, $500 hiring and $9,000 sales or use tax
 * carryovers, $8,000 of tax: 8A (f) 500, 9A (e) 6,500, 9B (g) 2,500 (::example-part-ii::b01 to ::b03).
 */
export function scheduleZPartII(
  line7: number,
  hiringCarryover: number,
  salesUseCarryover: number,
  used: number,
): ScheduleZPartII {
  const line8Bd = hiringCarryover;
  const line9Bd = salesUseCarryover;
  const line8Af = Math.min(atLeast(0, used), line7, line8Bd);
  const line8Be = Math.min(line7, line8Af);
  const line9Ae = line7 - line8Be;
  const line9Af = Math.min(atLeast(0, used) - line8Af, line9Ae, line9Bd);
  const line9Be = Math.min(line9Ae, line9Af);
  return {
    line8Ae: line7,
    line8Af,
    line8Bb: hiringCarryover,
    line8Bd,
    line8Be,
    line8Bg: line8Bd - line8Be,
    line9Ae,
    line9Af,
    line9Bb: salesUseCarryover,
    line9Bd,
    line9Be,
    line9Bg: line9Bd - line9Be,
  };
}

/*
 * Line 1c: "Add line 1a and line 1b" (the form); line 1a is 8A (f) and line 1b
 * 9A (f) for an individual.
 */
export const line1c = (hiringUsed: number, salesUseUsed: number): number =>
  hiringUsed + salesUseUsed;
