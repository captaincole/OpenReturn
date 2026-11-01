/*
 * Federal Tax Computation Worksheet (income ≥ $100,000): tax = income × rate − subtractAmount.
 * Source: 1040 instructions (2025) p. 80, Tax Computation Worksheet—Line 16; Rev. Proc. 2024-40.
 */

import type { FilingStatus } from "../values.js";

export interface RateScheduleRow {
  /** Exclusive, except the first row ("At least $100,000"). */
  overMin: number;
  /** Inclusive. */
  overMax: number;
  rate: number;
  subtractAmount: number;
}

interface RateScheduleTable {
  taxYear: number;
  jurisdiction: "federal";
  source: { docId: string; blockId: string; page: number };
  byStatus: Record<FilingStatus, RateScheduleRow[]>;
}

/* Rows sort ascending by overMin. Single and MFS match below $250,525 by design. */
const SCHEDULE_2025_FEDERAL: RateScheduleTable = {
  taxYear: 2025,
  jurisdiction: "federal",
  source: {
    docId: "irs-1040-inst-2025",
    blockId: "irs-1040-inst-2025::sec::2025-tax-computation-worksheet-line-16::b02",
    page: 80,
  },
  byStatus: {
    single: [
      { overMin: 100000, overMax: 103350, rate: 0.22, subtractAmount: 5086.0 },
      { overMin: 103350, overMax: 197300, rate: 0.24, subtractAmount: 7153.0 },
      { overMin: 197300, overMax: 250525, rate: 0.32, subtractAmount: 22937.0 },
      { overMin: 250525, overMax: 626350, rate: 0.35, subtractAmount: 30452.75 },
      { overMin: 626350, overMax: Infinity, rate: 0.37, subtractAmount: 42979.75 },
    ],
    married_filing_jointly: [
      { overMin: 100000, overMax: 206700, rate: 0.22, subtractAmount: 10172.0 },
      { overMin: 206700, overMax: 394600, rate: 0.24, subtractAmount: 14306.0 },
      { overMin: 394600, overMax: 501050, rate: 0.32, subtractAmount: 45874.0 },
      { overMin: 501050, overMax: 751600, rate: 0.35, subtractAmount: 60905.5 },
      { overMin: 751600, overMax: Infinity, rate: 0.37, subtractAmount: 75937.5 },
    ],
    qualifying_surviving_spouse: [
      { overMin: 100000, overMax: 206700, rate: 0.22, subtractAmount: 10172.0 },
      { overMin: 206700, overMax: 394600, rate: 0.24, subtractAmount: 14306.0 },
      { overMin: 394600, overMax: 501050, rate: 0.32, subtractAmount: 45874.0 },
      { overMin: 501050, overMax: 751600, rate: 0.35, subtractAmount: 60905.5 },
      { overMin: 751600, overMax: Infinity, rate: 0.37, subtractAmount: 75937.5 },
    ],
    married_filing_separately: [
      { overMin: 100000, overMax: 103350, rate: 0.22, subtractAmount: 5086.0 },
      { overMin: 103350, overMax: 197300, rate: 0.24, subtractAmount: 7153.0 },
      { overMin: 197300, overMax: 250525, rate: 0.32, subtractAmount: 22937.0 },
      { overMin: 250525, overMax: 375800, rate: 0.35, subtractAmount: 30452.75 },
      { overMin: 375800, overMax: Infinity, rate: 0.37, subtractAmount: 37968.75 },
    ],
    head_of_household: [
      { overMin: 100000, overMax: 103350, rate: 0.22, subtractAmount: 6825.0 },
      { overMin: 103350, overMax: 197300, rate: 0.24, subtractAmount: 8892.0 },
      { overMin: 197300, overMax: 250500, rate: 0.32, subtractAmount: 24676.0 },
      { overMin: 250500, overMax: 626350, rate: 0.35, subtractAmount: 32191.0 },
      { overMin: 626350, overMax: Infinity, rate: 0.37, subtractAmount: 44718.0 },
    ],
  },
};

export const FEDERAL_RATE_SCHEDULES_2025 = SCHEDULE_2025_FEDERAL.byStatus;

const SCHEDULES_BY_YEAR: Record<number, RateScheduleTable> = {
  2025: SCHEDULE_2025_FEDERAL,
};

/** Returns un-rounded tax; the caller rounds. Throws below $100,000 (use the Tax Table). */
export function lookupRateSchedule(
  taxYear: number,
  filingStatus: FilingStatus,
  taxableIncome: number,
): number {
  const table = SCHEDULES_BY_YEAR[taxYear];
  if (!table) {
    throw new Error(
      `No rate schedule loaded for tax year ${taxYear}. Available: ${Object.keys(SCHEDULES_BY_YEAR).join(", ")}.`,
    );
  }
  const rows = table.byStatus[filingStatus];
  if (!rows) {
    throw new Error(
      `Filing status "${filingStatus}" has no rate schedule in the ${taxYear} table.`,
    );
  }
  if (taxableIncome < 100000) {
    throw new Error(
      `lookupRateSchedule called with taxableIncome=${taxableIncome} < $100,000. Use lookupTax (Tax Table) instead — the IRS only publishes the rate schedule for ≥ $100,000.`,
    );
  }
  for (const row of rows) {
    // The worksheet's first row reads "At least $100,000"; the rest read "over".
    const aboveMin = row === rows[0] ? taxableIncome >= row.overMin : taxableIncome > row.overMin;
    if (aboveMin && taxableIncome <= row.overMax) {
      return taxableIncome * row.rate - row.subtractAmount;
    }
  }
  throw new Error(
    `Tax computation worksheet: no row matched taxableIncome=${taxableIncome} for ${filingStatus} in ${taxYear}.`,
  );
}
