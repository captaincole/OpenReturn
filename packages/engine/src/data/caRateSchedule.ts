/*
 * California tax rate schedules (Form 540 line 31) for taxable income
 * over $100,000. At or below $100,000, FTB instructs use of the Tax
 * Table (taxTable.ts, "ca-2025").
 *
 * Keyed exactly as FTB prints them — "base + rate × amount over" — not
 * converted to the federal "multiply and subtract" form, so every
 * number here can be checked against the booklet by eye:
 *
 *     tax = base + rate × (income − overMin)
 *
 * Source: 2025 California 540 Personal Income Tax Booklet, page 75 —
 * 2025 California Tax Rate Schedules X, Y, Z.
 * Block id: ca-540-booklet-2025::sec::schedule-x::b01.
 *
 * Rows below $100,000 are kept: the base of each higher row depends on
 * them, and a full copy is easier to verify against the page.
 */

import type { FilingStatus } from "../values.js";

export interface CaRateScheduleRow {
  /** Bracket lower bound, exclusive: income > overMin. */
  overMin: number;
  /** Bracket upper bound, inclusive. Infinity for the top bracket. */
  overMax: number;
  /** Tax on income up to overMin. */
  base: number;
  /** Marginal rate as a decimal (0.093 for 9.3%). */
  rate: number;
}

type Schedule = CaRateScheduleRow[];

// Schedule X — Single or Married/RDP Filing Separately.
const X_2025: Schedule = [
  { overMin: 0, overMax: 11079, base: 0, rate: 0.01 },
  { overMin: 11079, overMax: 26264, base: 110.79, rate: 0.02 },
  { overMin: 26264, overMax: 41452, base: 414.49, rate: 0.04 },
  { overMin: 41452, overMax: 57542, base: 1022.01, rate: 0.06 },
  { overMin: 57542, overMax: 72724, base: 1987.41, rate: 0.08 },
  { overMin: 72724, overMax: 371479, base: 3201.97, rate: 0.093 },
  { overMin: 371479, overMax: 445771, base: 30986.19, rate: 0.103 },
  { overMin: 445771, overMax: 742953, base: 38638.27, rate: 0.113 },
  { overMin: 742953, overMax: Infinity, base: 72219.84, rate: 0.123 },
];

// Schedule Y — Married/RDP Filing Jointly or Qualifying Surviving Spouse/RDP.
const Y_2025: Schedule = [
  { overMin: 0, overMax: 22158, base: 0, rate: 0.01 },
  { overMin: 22158, overMax: 52528, base: 221.58, rate: 0.02 },
  { overMin: 52528, overMax: 82904, base: 828.98, rate: 0.04 },
  { overMin: 82904, overMax: 115084, base: 2044.02, rate: 0.06 },
  { overMin: 115084, overMax: 145448, base: 3974.82, rate: 0.08 },
  { overMin: 145448, overMax: 742958, base: 6403.94, rate: 0.093 },
  { overMin: 742958, overMax: 891542, base: 61972.37, rate: 0.103 },
  { overMin: 891542, overMax: 1485906, base: 77276.52, rate: 0.113 },
  { overMin: 1485906, overMax: Infinity, base: 144439.65, rate: 0.123 },
];

// Schedule Z — Head of Household.
const Z_2025: Schedule = [
  { overMin: 0, overMax: 22173, base: 0, rate: 0.01 },
  { overMin: 22173, overMax: 52530, base: 221.73, rate: 0.02 },
  { overMin: 52530, overMax: 67716, base: 828.87, rate: 0.04 },
  { overMin: 67716, overMax: 83805, base: 1436.31, rate: 0.06 },
  { overMin: 83805, overMax: 98990, base: 2401.65, rate: 0.08 },
  { overMin: 98990, overMax: 505208, base: 3616.45, rate: 0.093 },
  { overMin: 505208, overMax: 606251, base: 41394.72, rate: 0.103 },
  { overMin: 606251, overMax: 1010417, base: 51802.15, rate: 0.113 },
  { overMin: 1010417, overMax: Infinity, base: 97472.91, rate: 0.123 },
];

/** Exported for the data-integrity test only. */
export const CA_RATE_SCHEDULES_2025 = { X: X_2025, Y: Y_2025, Z: Z_2025 };

const SCHEDULES_BY_YEAR: Record<number, Record<FilingStatus, Schedule>> = {
  2025: {
    single: X_2025,
    married_filing_separately: X_2025,
    married_filing_jointly: Y_2025,
    qualifying_surviving_spouse: Y_2025,
    head_of_household: Z_2025,
  },
};

/**
 * Form 540 line 31 tax for taxable income over $100,000. Returns the
 * un-rounded result; the caller rounds to the nearest dollar (CLAUDE.md). A call
 * at or below $100,000 throws: FTB instructs the Tax Table there.
 */
export function lookupCaRateSchedule(
  taxYear: number,
  filingStatus: FilingStatus,
  taxableIncome: number,
): number {
  const byStatus = SCHEDULES_BY_YEAR[taxYear];
  if (!byStatus) {
    throw new Error(`No CA rate schedule loaded for tax year ${taxYear}.`);
  }
  if (taxableIncome <= 100000) {
    throw new Error(
      `lookupCaRateSchedule called with taxableIncome=${taxableIncome} ≤ $100,000. Use lookupTax("ca-${taxYear}") (Tax Table) instead.`,
    );
  }
  const row = byStatus[filingStatus].find(
    (r) => taxableIncome > r.overMin && taxableIncome <= r.overMax,
  );
  if (!row) {
    throw new Error(`CA rate schedule: no row for ${taxableIncome} (${filingStatus}, ${taxYear}).`);
  }
  return row.base + row.rate * (taxableIncome - row.overMin);
}
