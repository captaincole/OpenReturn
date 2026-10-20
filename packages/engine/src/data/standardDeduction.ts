/*
 * Standard-deduction lookup table, keyed by (jurisdiction, taxYear,
 * filingStatus). Parallel in structure to taxTable.ts in this directory;
 * both are per-jurisdiction reference data that bindings call inline.
 *
 * Bindings call this instead of carrying inline literals so that:
 *   - Annual amount updates land in one file, not N bindings
 *   - A new jurisdiction (state-NY, state-OR, …) means one appended
 *     entry, not edits to every state form's bindings
 *
 * Sources:
 *   - federal 2025: IRS Rev. Proc. 2024-40 (inflation adjustments for
 *     2025). Also printed on Form 1040 Instructions page 32.
 *   - state-ca 2025: FTB 540 instructions, Schedule X.
 */

import type { FilingStatus } from "../values.js";

interface StandardDeductionTable {
  jurisdiction: string;
  taxYear: number;
  byFilingStatus: Record<FilingStatus, number>;
  source: { url?: string; note: string };
}

const TABLES: StandardDeductionTable[] = [
  {
    jurisdiction: "federal",
    taxYear: 2025,
    byFilingStatus: {
      single: 15750,
      married_filing_separately: 15750,
      married_filing_jointly: 31500,
      qualifying_surviving_spouse: 31500,
      head_of_household: 23625,
    },
    source: {
      url: "https://www.irs.gov/pub/irs-pdf/i1040gi.pdf",
      note: "Form 1040 Instructions, 2025 Standard Deduction table",
    },
  },
  {
    jurisdiction: "state-ca",
    taxYear: 2025,
    byFilingStatus: {
      single: 5706,
      married_filing_separately: 5706,
      married_filing_jointly: 11412,
      qualifying_surviving_spouse: 11412,
      head_of_household: 11412,
    },
    source: {
      note: "CA FTB Form 540 2025 Instructions — standard deduction",
    },
  },
];

/**
 * Look up the standard deduction for a (jurisdiction, year, filingStatus)
 * tuple. Returns undefined when no table is loaded for that combination.
 * Bindings then short-circuit to undefined, which blocks the field,
 * instead of a silently wrong default.
 *
 * The 65+ / blind increase is lookupAdditionalStandardDeduction below.
 * The worksheet for a taxpayer someone else can claim as a dependent is
 * not modeled.
 */
export function lookupStandardDeduction(
  jurisdiction: string,
  taxYear: number,
  filingStatus: FilingStatus,
): number | undefined {
  const table = TABLES.find((t) => t.jurisdiction === jurisdiction && t.taxYear === taxYear);
  return table?.byFilingStatus[filingStatus];
}

/*
 * Federal 2025 increase per box checked on 1040 line 12d (born before
 * January 2, 1961, or blind): $2,000 for single or head of household,
 * $1,600 otherwise. Source: Form 1040 Instructions (2025), Standard
 * Deduction Worksheet for Dependents line 4b and the Standard Deduction
 * Chart for People Who Were Born Before January 2, 1961, or Were Blind
 * (MFS, one box: $15,750 + $1,600 = $17,350).
 */
export function lookupAdditionalStandardDeduction(
  taxYear: number,
  filingStatus: FilingStatus,
): number | undefined {
  if (taxYear !== 2025) return undefined;
  return filingStatus === "single" || filingStatus === "head_of_household" ? 2000 : 1600;
}
