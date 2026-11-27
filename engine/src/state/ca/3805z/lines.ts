/*
 * FTB 3805Z, Enterprise Zone Deduction and Credit Summary: the arithmetic,
 * pure. Written by hand from ca-3805z-booklet-2025 and ca-3805z-face-2025,
 * for an individual on Form 540. The booklet's examples with numbers are unit
 * tests (QUESTIONS.md).
 */

import { atLeast, roundDollars, roundToPlaces, sum, wholePart } from "../../../money.js";

/* "Rented property is valued at eight times the net annual rental rate" (ca-3805z-booklet-2025::sec::apportionment::b02). */
export const RENT_MULTIPLIER = 8;

/*
 * The places a Worksheet I, Section A percentage keeps: four decimal places
 * (two in percent), the rest dropped. The booklet's example prints 66.66% for
 * $800,000 / $1,200,000 and 73.33% for the average, and its $183,325 is
 * $250,000 × 0.7333 (ca-3805z-booklet-2025::sec::apportionment::b07); no text
 * states a rule (QUESTIONS.md).
 */
export const PERCENTAGE_PLACES = 4;
const PERCENTAGE_SCALE = 10 ** PERCENTAGE_PLACES;
/* Absorbs float error only: 0.29 scaled is 2899.9999999999995. */
const FLOAT_TOLERANCE = 1e-9;

/*
 * The $5,000,000 limit on business credits for 2025 and 2026: "The total of
 * all business credits including the carryover of any business credit for the
 * taxable year may not reduce the 'net tax' ... by more than $5,000,000"
 * (ca-3805z-booklet-2025::sec::credit-carryover-limitations::b02).
 */
export const BUSINESS_CREDIT_LIMIT = 5_000_000;

/* "Use credit code 176 to claim the EZ hiring credit carryover and sales or use tax credit carryover" (ca-3805z-booklet-2025::sec::credit-code::b01). */
export const ENTERPRISE_ZONE_CREDIT_CODE = "176";
/* The Credit Table names code 176 "Enterprise Zone Hiring" and "Enterprise Zone Sales or Use Tax" (ca-540-sched-p-inst-2025::sec::credit-table::b06); one line takes both. */
export const ENTERPRISE_ZONE_CREDIT_NAME = "Enterprise Zone";

/* A ratio kept to four places, the rest dropped. */
export function truncatedPercentage(ratio: number): number {
  return wholePart(ratio * PERCENTAGE_SCALE + FLOAT_TOLERANCE) / PERCENTAGE_SCALE;
}

/* A Section A percentage as the form prints it: "73.33%". */
export function percentageText(ratio: number): string {
  const hundredths = roundToPlaces(ratio * 100 * 100, 0);
  const whole = wholePart(hundredths / 100);
  const rest = hundredths - whole * 100;
  return `${whole}.${String(rest).padStart(2, "0")}%`;
}

export interface SectionAAmounts {
  /* Line 1 column (a) and (b): owned property at original cost. */
  ownedPropertyCalifornia: number;
  ownedPropertyZone: number;
  /* The net annual rent of rented property. */
  netAnnualRentCalifornia: number;
  netAnnualRentZone: number;
  /* Line 2 column (a) and (b). */
  payrollCalifornia: number;
  payrollZone: number;
}

/* Line 1 total property values: owned property plus eight times the rent. */
export const propertyValue = (owned: number, netAnnualRent: number): number =>
  owned + RENT_MULTIPLIER * netAnnualRent;

/*
 * Worksheet I, Section A line 4: line 3, the sum of the column (c)
 * percentages, over the number of factors. "Factors with zero balances in the
 * totals of column (a) will not be included in the computation of the average
 * apportionment percentage" (ca-3805z-booklet-2025::sec::property-factor-2::b02).
 * Undefined when both factors are zero: there is nothing to apportion.
 */
export function sectionALine4(amounts: SectionAAmounts): number | undefined {
  const factors = [
    [
      propertyValue(amounts.ownedPropertyZone, amounts.netAnnualRentZone),
      propertyValue(amounts.ownedPropertyCalifornia, amounts.netAnnualRentCalifornia),
    ],
    [amounts.payrollZone, amounts.payrollCalifornia],
  ].filter(([, california]) => california > 0);
  if (factors.length === 0) return undefined;
  const line3 = sum(...factors.map(([zone, california]) => truncatedPercentage(zone / california)));
  return truncatedPercentage(line3 / factors.length);
}

/* One Worksheet I, Section B row: column (a) and column (b). */
export interface SectionBRow {
  amount: number;
  share: number;
}

/*
 * Worksheet I, Section B line 14: "Add line 3, line 10, and line 13, column
 * (c), and line 5, column (b)" (the worksheet), where each column (c) is
 * column (a) times column (b). The rows keep their cents and only the total
 * is rounded (CLAUDE.md, a total of computed rows).
 */
export const sectionBLine14 = (rows: readonly SectionBRow[]): number =>
  roundDollars(sum(...rows.map((row) => row.amount * row.share)));

/* Worksheet II, one line 8 row. */
export interface NolRow {
  yearOfLoss: number;
  /* Column (b). */
  carryover: number;
  /* Column (c). */
  deducted: number;
  /* Column (d): the balance after this row. */
  balance: number;
  /* Column (e). */
  remaining: number;
}

export interface NolWorksheet {
  /* Line 6 and line 7 column (d), the modified taxable income. */
  modifiedTaxableIncome: number;
  rows: NolRow[];
  /* Line 9, columns (b), (c) and (e). */
  totalCarryover: number;
  totalDeducted: number;
  totalRemaining: number;
}

/*
 * Worksheet II for a Form 540 filer. Line 1 and line 6 take Section B line 14
 * (skip lines 2 to 5); "If zero or less, enter -0- on line 6" (line 4). Each
 * line 8 row, oldest first: column (c) "the smaller of the amount in column
 * (b) or the amount in column (d) from the previous line", (d) the previous
 * balance less (c), and (e) column (b) less (c)
 * (ca-3805z-booklet-2025::sec::form-540-and-form-540nr-filers::b02). With the
 * deduction suspended "do not put any amounts in column (c). Carryover the
 * column (b) amount(s) to column (e)" (the same block).
 */
export function nolWorksheet(
  line14: number,
  carryovers: ReadonlyArray<{ yearOfLoss: number; amount: number }>,
  suspended: boolean,
): NolWorksheet {
  const modifiedTaxableIncome = atLeast(0, line14);
  let balance = modifiedTaxableIncome;
  const rows = [...carryovers]
    .sort((left, right) => left.yearOfLoss - right.yearOfLoss)
    .map(({ yearOfLoss, amount }) => {
      const carryover = roundDollars(amount);
      const deducted = suspended ? 0 : Math.min(carryover, balance);
      balance -= deducted;
      return { yearOfLoss, carryover, deducted, balance, remaining: carryover - deducted };
    });
  return {
    modifiedTaxableIncome,
    rows,
    totalCarryover: sum(...rows.map((row) => row.carryover)),
    totalDeducted: sum(...rows.map((row) => row.deducted)),
    totalRemaining: sum(...rows.map((row) => row.remaining)),
  };
}

/* Schedule Z line 5: "Subtract line 4 from line 3". */
export const line5 = (line3: number, line4: number): number => line3 - line4;

/* Schedule Z line 7: "Enter the smaller of line 6a or line 6b". */
export const line7 = (line6a: number, line6b: number): number => Math.min(line6a, line6b);

/*
 * The credit available to offset tax (Schedule P (540) column (a)): the two
 * carryovers up to the limitation based on EZ business income. Line 8A
 * column (f) "cannot be greater than the amount on line 8A, column (e) or the
 * amount computed on line 8B, column (d)", and line 9A column (e) is what is
 * left of line 7 (ca-3805z-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01, ::b03).
 */
export const creditAvailable = (line7: number, hiring: number, salesOrUse: number): number =>
  Math.min(atLeast(0, line7), hiring + salesOrUse);

/* Schedule Z Part II, lines 8 and 9, columns (b) to (g). Column (c) is blank for an individual. */
export interface PartII {
  line8: { aE: number; aF: number; bB: number; bD: number; bE: number; bG: number };
  line9: { aE: number; aF: number; bB: number; bD: number; bE: number; bG: number };
}

/*
 * Part II from line 7, the two carryovers and `used`, the credit Schedule P
 * (540) column (b) lets the return take (at most creditAvailable). The hiring
 * credit is used first: line 8 comes before line 9, and line 9A column (e) is
 * "the amount on line 8B, column (e)" less line 8A column (e). For an
 * individual, column (c) is blank, so column (d) is column (b)
 * (::b02, ::b04 of the Part II instructions).
 */
export function partII(line7: number, hiring: number, salesOrUse: number, used: number): PartII {
  const hiringUsed = Math.min(used, hiring);
  const hiringE = Math.min(line7, hiringUsed);
  const salesLimit = line7 - hiringE;
  const salesUsed = used - hiringUsed;
  const salesE = Math.min(salesLimit, salesUsed);
  return {
    line8: { aE: line7, aF: hiringUsed, bB: hiring, bD: hiring, bE: hiringE, bG: hiring - hiringE },
    line9: {
      aE: salesLimit,
      aF: salesUsed,
      bB: salesOrUse,
      bD: salesOrUse,
      bE: salesE,
      bG: salesOrUse - salesE,
    },
  };
}
