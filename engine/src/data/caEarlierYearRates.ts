/*
 * The California tax rate schedules X, Y and Z of tax years 2020 to 2024, for
 * FTB 5870A Part I line 15 and Part II lines 7 and 9: "Compute the tax (not
 * including any AMT) on the income on line 14 using the tax rates in effect for
 * the earlier year ... Use the California tax tables included in the personal
 * income tax booklets for prior years"
 * (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b05,
 * ca-5870a-inst-2025::sec::section-a::b03).
 *
 * Source: each year's "California Tax Rate Schedules" page, as FTB prints it
 * (ftb.ca.gov/forms/<year>/<year>-540-tax-rate-schedules.pdf for 2021 to 2024,
 * the 2020 Form 540 booklet page 97 for 2020). Read on 2026-11-25; the corpus
 * does not hold them. Each row is "over" and the tax at that amount; the rates
 * are the same every year.
 *
 * Up to $100,000 the booklets send the reader to the Tax Table. FTB builds each
 * row of that table from the rate schedule: the tax on the row's whole-dollar
 * midpoint, rounded to the nearest dollar. That rule reproduces every row of the
 * 2020 to 2025 tables in all three columns (state/ca/5870a/QUESTIONS.md), so the
 * engine figures the table rows instead of storing five more tables.
 */

import { roundDollars, roundToPlaces, stepsOf, wholePart } from "../money.js";
import type { FilingStatus } from "../values.js";

/* The rate on the part of the income above each row's "over" amount. */
export const CA_RATES = [0.01, 0.02, 0.04, 0.06, 0.08, 0.093, 0.103, 0.113, 0.123] as const;
/* "Use only if your taxable income on Form 540, line 19 is more than $100,000." */
export const CA_TAX_TABLE_LIMIT = 100_000;
/* The Tax Table's rows: the first is $1 to $50, then $100 wide ($51 to $150, ...). */
const FIRST_ROW_TOP = 50;
const ROW_WIDTH = 100;

/* One schedule: each row's "over" amount and the tax at it, nine rows. */
export interface CaEarlierYearSchedule {
  over: readonly number[];
  base: readonly number[];
}

type Schedules = { X: CaEarlierYearSchedule; Y: CaEarlierYearSchedule; Z: CaEarlierYearSchedule };

const schedule = (over: number[], base: number[]): CaEarlierYearSchedule => ({ over, base });

export const CA_EARLIER_YEAR_SCHEDULES: Record<number, Schedules> = {
  2020: {
    X: schedule(
      [0, 8932, 21175, 33421, 46394, 58634, 299508, 359407, 599012],
      [0, 89.32, 334.18, 824.02, 1602.4, 2581.6, 24982.88, 31152.48, 58227.85],
    ),
    Y: schedule(
      [0, 17864, 42350, 66842, 92788, 117268, 599016, 718814, 1198024],
      [0, 178.64, 668.36, 1648.04, 3204.8, 5163.2, 49965.76, 62304.95, 116455.68],
    ),
    Z: schedule(
      [0, 17876, 42353, 54597, 67569, 79812, 407329, 488796, 814658],
      [0, 178.76, 668.3, 1158.06, 1936.38, 2915.82, 33374.9, 41766.0, 78588.41],
    ),
  },
  2021: {
    X: schedule(
      [0, 9325, 22107, 34892, 48435, 61214, 312686, 375221, 625369],
      [0, 93.25, 348.89, 860.29, 1672.87, 2695.19, 26082.09, 32523.2, 60789.92],
    ),
    Y: schedule(
      [0, 18650, 44214, 69784, 96870, 122428, 625372, 750442, 1250738],
      [0, 186.5, 697.78, 1720.58, 3345.74, 5390.38, 52164.17, 65046.38, 121579.83],
    ),
    Z: schedule(
      [0, 18663, 44217, 56999, 70542, 83324, 425251, 510303, 850503],
      [0, 186.63, 697.71, 1208.99, 2021.57, 3044.13, 34843.34, 43603.7, 82046.3],
    ),
  },
  2022: {
    X: schedule(
      [0, 10099, 23942, 37788, 52455, 66295, 338639, 406364, 677275],
      [0, 100.99, 377.85, 931.69, 1811.71, 2918.91, 28246.9, 35222.58, 65835.52],
    ),
    Y: schedule(
      [0, 20198, 47884, 75576, 104910, 132590, 677278, 812728, 1354550],
      [0, 201.98, 755.7, 1863.38, 3623.42, 5837.82, 56493.8, 70445.15, 131671.04],
    ),
    Z: schedule(
      [0, 20212, 47887, 61730, 76397, 90240, 460547, 552658, 921095],
      [0, 202.12, 755.62, 1309.34, 2189.36, 3296.8, 37735.35, 47222.78, 88856.16],
    ),
  },
  2023: {
    X: schedule(
      [0, 10412, 24684, 38959, 54081, 68350, 349137, 418961, 698271],
      [0, 104.12, 389.56, 960.56, 1867.88, 3009.4, 29122.59, 36314.46, 67876.49],
    ),
    Y: schedule(
      [0, 20824, 49368, 77918, 108162, 136700, 698274, 837922, 1396542],
      [0, 208.24, 779.12, 1921.12, 3735.76, 6018.8, 58245.18, 72628.92, 135752.98],
    ),
    Z: schedule(
      [0, 20839, 49371, 63644, 78765, 93037, 474824, 569790, 949649],
      [0, 208.39, 779.03, 1349.95, 2257.21, 3398.97, 38905.16, 48686.66, 91610.73],
    ),
  },
  2024: {
    X: schedule(
      [0, 10756, 25499, 40245, 55866, 70606, 360659, 432787, 721314],
      [0, 107.56, 402.42, 992.26, 1929.52, 3108.72, 30083.65, 37512.83, 70116.38],
    ),
    Y: schedule(
      [0, 21512, 50998, 80490, 111732, 141212, 721318, 865574, 1442628],
      [0, 215.12, 804.84, 1984.52, 3859.04, 6217.44, 60167.3, 75025.67, 140232.77],
    ),
    Z: schedule(
      [0, 21527, 51000, 65744, 81364, 96107, 490493, 588593, 980987],
      [0, 215.27, 804.73, 1394.49, 2331.69, 3511.13, 40189.03, 50293.33, 94633.85],
    ),
  },
};

/* Schedule X: single or married/RDP filing separately; Y: joint or surviving spouse; Z: head of household. */
function scheduleFor(year: number, status: FilingStatus): CaEarlierYearSchedule | undefined {
  const schedules = CA_EARLIER_YEAR_SCHEDULES[year];
  if (schedules === undefined) return undefined;
  if (status === "married_filing_jointly" || status === "qualifying_surviving_spouse")
    return schedules.Y;
  return status === "head_of_household" ? schedules.Z : schedules.X;
}

/* The rate schedule: the row's tax plus its rate on the amount over the row. Un-rounded. */
export function scheduleTax(amount: number, rows: CaEarlierYearSchedule): number {
  if (amount <= 0) return 0;
  const index = rows.over.filter((over) => amount > over).length - 1;
  return rows.base[index] + CA_RATES[index] * (amount - rows.over[index]);
}

/* The Tax Table row's whole-dollar midpoint: $1 to $50 is 25; $51 to $150 is 100; the last row stops at $100,000. */
export function taxTableMidpoint(income: number): number {
  if (income <= FIRST_ROW_TOP) return wholePart((1 + FIRST_ROW_TOP) / 2);
  const row = stepsOf(income - FIRST_ROW_TOP, ROW_WIDTH);
  const low = FIRST_ROW_TOP + ROW_WIDTH * (row - 1) + 1;
  const high = Math.min(FIRST_ROW_TOP + ROW_WIDTH * row, CA_TAX_TABLE_LIMIT);
  return wholePart((low + high) / 2);
}

/*
 * The California tax on a year's taxable income, whole dollars: the Tax Table
 * up to $100,000, the rate schedule above. Undefined for a year the engine does
 * not hold.
 */
export function caEarlierYearTax(
  year: number,
  status: FilingStatus,
  taxableIncome: number,
): number | undefined {
  const rows = scheduleFor(year, status);
  if (rows === undefined) return undefined;
  const income = roundDollars(taxableIncome);
  if (income <= 0) return 0;
  // The table rounds the exact tax at the midpoint: cents snapped first would turn 2021's $4,176.498 into $4,177, not the printed $4,176.
  if (income <= CA_TAX_TABLE_LIMIT)
    return roundToPlaces(scheduleTax(taxTableMidpoint(income), rows), 0);
  // The schedule: "round the amount from Step 3 to two decimals ... After rounding the result" (the 2024 schedules' example).
  return roundDollars(scheduleTax(income, rows));
}
