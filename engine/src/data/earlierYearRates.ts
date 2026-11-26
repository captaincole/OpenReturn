/*
 * The federal Tax Rate Schedules and the 0% / 15% capital gain ceilings of tax
 * years 2020 to 2024, for Form 4970 line 17: "Figure the income tax ... on the
 * income on line 16 using the tax rates in effect for your particular earlier
 * tax year ... Use the Tax Rate Schedules, etc., as applicable"
 * (irs-4970-form-2025::sec::line-17::b01).
 *
 * Source: each year's revenue procedure, section 3.01 (Tax Rate Tables 1 to 4)
 * and section 3.03 (Maximum Zero Rate Amount, Maximum 15-percent Rate Amount):
 * Rev. Proc. 2019-44 (2020), 2020-45 (2021), 2021-45 (2022), 2022-38 (2023),
 * 2023-34 (2024). Read from the IRS copies on 2026-11-25; the corpus does not
 * hold them. The rates are the same each year: 10, 12, 22, 24, 32, 35, 37%.
 */

import type { FilingStatus } from "../values.js";

export const ORDINARY_RATES = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37] as const;

export interface EarlierYearRates {
  /* The top of each bracket but the last ("Not over $X"), one per rate but the 37% rate. */
  bracketTops: readonly [number, number, number, number, number, number];
  /* Maximum Zero Rate Amount, section 1(h)(1)(B)(i). */
  zeroRateCeiling: number;
  /* Maximum 15-percent Rate Amount, section 1(h)(1)(C)(ii)(I). */
  fifteenRateCeiling: number;
}

type StatusTable = Record<Exclude<FilingStatus, "qualifying_surviving_spouse">, EarlierYearRates>;

const RATES_BY_YEAR: Record<number, StatusTable> = {
  // Rev. Proc. 2019-44.
  2020: {
    married_filing_jointly: {
      bracketTops: [19750, 80250, 171050, 326600, 414700, 622050],
      zeroRateCeiling: 80000,
      fifteenRateCeiling: 496600,
    },
    head_of_household: {
      bracketTops: [14100, 53700, 85500, 163300, 207350, 518400],
      zeroRateCeiling: 53600,
      fifteenRateCeiling: 469050,
    },
    single: {
      bracketTops: [9875, 40125, 85525, 163300, 207350, 518400],
      zeroRateCeiling: 40000,
      fifteenRateCeiling: 441450,
    },
    married_filing_separately: {
      bracketTops: [9875, 40125, 85525, 163300, 207350, 311025],
      zeroRateCeiling: 40000,
      fifteenRateCeiling: 248300,
    },
  },
  // Rev. Proc. 2020-45.
  2021: {
    married_filing_jointly: {
      bracketTops: [19900, 81050, 172750, 329850, 418850, 628300],
      zeroRateCeiling: 80800,
      fifteenRateCeiling: 501600,
    },
    head_of_household: {
      bracketTops: [14200, 54200, 86350, 164900, 209400, 523600],
      zeroRateCeiling: 54100,
      fifteenRateCeiling: 473750,
    },
    single: {
      bracketTops: [9950, 40525, 86375, 164925, 209425, 523600],
      zeroRateCeiling: 40400,
      fifteenRateCeiling: 445850,
    },
    married_filing_separately: {
      bracketTops: [9950, 40525, 86375, 164925, 209425, 314150],
      zeroRateCeiling: 40400,
      fifteenRateCeiling: 250800,
    },
  },
  // Rev. Proc. 2021-45.
  2022: {
    married_filing_jointly: {
      bracketTops: [20550, 83550, 178150, 340100, 431900, 647850],
      zeroRateCeiling: 83350,
      fifteenRateCeiling: 517200,
    },
    head_of_household: {
      bracketTops: [14650, 55900, 89050, 170050, 215950, 539900],
      zeroRateCeiling: 55800,
      fifteenRateCeiling: 488500,
    },
    single: {
      bracketTops: [10275, 41775, 89075, 170050, 215950, 539900],
      zeroRateCeiling: 41675,
      fifteenRateCeiling: 459750,
    },
    married_filing_separately: {
      bracketTops: [10275, 41775, 89075, 170050, 215950, 323925],
      zeroRateCeiling: 41675,
      fifteenRateCeiling: 258600,
    },
  },
  // Rev. Proc. 2022-38.
  2023: {
    married_filing_jointly: {
      bracketTops: [22000, 89450, 190750, 364200, 462500, 693750],
      zeroRateCeiling: 89250,
      fifteenRateCeiling: 553850,
    },
    head_of_household: {
      bracketTops: [15700, 59850, 95350, 182100, 231250, 578100],
      zeroRateCeiling: 59750,
      fifteenRateCeiling: 523050,
    },
    single: {
      bracketTops: [11000, 44725, 95375, 182100, 231250, 578125],
      zeroRateCeiling: 44625,
      fifteenRateCeiling: 492300,
    },
    married_filing_separately: {
      bracketTops: [11000, 44725, 95375, 182100, 231250, 346875],
      zeroRateCeiling: 44625,
      fifteenRateCeiling: 276900,
    },
  },
  // Rev. Proc. 2023-34.
  2024: {
    married_filing_jointly: {
      bracketTops: [23200, 94300, 201050, 383900, 487450, 731200],
      zeroRateCeiling: 94050,
      fifteenRateCeiling: 583750,
    },
    head_of_household: {
      bracketTops: [16550, 63100, 100500, 191950, 243700, 609350],
      zeroRateCeiling: 63000,
      fifteenRateCeiling: 551350,
    },
    single: {
      bracketTops: [11600, 47150, 100525, 191950, 243725, 609350],
      zeroRateCeiling: 47025,
      fifteenRateCeiling: 518900,
    },
    married_filing_separately: {
      bracketTops: [11600, 47150, 100525, 191950, 243725, 365600],
      zeroRateCeiling: 47025,
      fifteenRateCeiling: 291850,
    },
  },
};

/* The years this table holds: Form 4970 line 13, columns (e) to (a). */
export const EARLIER_RATE_YEARS = [2020, 2021, 2022, 2023, 2024] as const;

/*
 * A surviving spouse uses Table 1 with a joint return ("Married Individuals
 * Filing Joint Returns and Surviving Spouses"). Undefined for a year the table
 * does not hold.
 */
export function earlierYearRates(year: number, status: FilingStatus): EarlierYearRates | undefined {
  const table = RATES_BY_YEAR[year];
  if (table === undefined) return undefined;
  return table[status === "qualifying_surviving_spouse" ? "married_filing_jointly" : status];
}
