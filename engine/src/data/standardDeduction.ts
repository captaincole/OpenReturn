/*
 * Sources: federal 2025, Rev. Proc. 2024-40 (1040 instructions p. 32);
 * state-ca 2025, FTB 540 instructions.
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
 * Undefined when no table is loaded: the field then blocks, never a wrong default.
 * The dependent standard deduction worksheet is not modeled.
 */
export function lookupStandardDeduction(
  jurisdiction: string,
  taxYear: number,
  filingStatus: FilingStatus,
): number | undefined {
  const table = TABLES.find(
    (entry) => entry.jurisdiction === jurisdiction && entry.taxYear === taxYear,
  );
  return table?.byFilingStatus[filingStatus];
}

/*
 * Per box checked on 1040 line 12d (65+ or blind). Source: 1040 instructions (2025),
 * Standard Deduction Chart for People Born Before January 2, 1961, or Blind.
 */
export function lookupAdditionalStandardDeduction(
  taxYear: number,
  filingStatus: FilingStatus,
): number | undefined {
  if (taxYear !== 2025) return undefined;
  return filingStatus === "single" || filingStatus === "head_of_household" ? 2000 : 1600;
}
