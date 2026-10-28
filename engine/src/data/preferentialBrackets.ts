/*
 * QDCG worksheet 0% / 15% ceilings (20% above). Ordinary income fills the brackets first;
 * preferential income stacks on top (worksheet lines 7–9 and 12–17).
 * Source: 1040 instructions (2025) p. 38, QDCG worksheet lines 6 and 13; Rev. Proc. 2024-40.
 */

import type { FilingStatus } from "../values.js";

export interface PreferentialBrackets {
  zeroRateCeiling: number;
  fifteenRateCeiling: number;
}

interface BracketTable {
  taxYear: number;
  jurisdiction: "federal";
  source: { docId: string; blockId: string; page: number };
  byStatus: Record<FilingStatus, PreferentialBrackets>;
}

const BRACKETS_2025_FEDERAL: BracketTable = {
  taxYear: 2025,
  jurisdiction: "federal",
  source: {
    docId: "irs-1040-inst-2025",
    blockId:
      "irs-1040-inst-2025::sec::qualified-dividends-and-capital-gain-tax-worksheet-line-16::b02",
    page: 38,
  },
  byStatus: {
    single: { zeroRateCeiling: 48350, fifteenRateCeiling: 533400 },
    married_filing_separately: { zeroRateCeiling: 48350, fifteenRateCeiling: 300000 },
    married_filing_jointly: { zeroRateCeiling: 96700, fifteenRateCeiling: 600050 },
    qualifying_surviving_spouse: { zeroRateCeiling: 96700, fifteenRateCeiling: 600050 },
    head_of_household: { zeroRateCeiling: 64750, fifteenRateCeiling: 566700 },
  },
};

const TABLES_BY_YEAR: Record<number, BracketTable> = {
  2025: BRACKETS_2025_FEDERAL,
};

/** Throws on an unknown year or status. Callers guard at the binding layer. */
export function lookupPreferentialBrackets(
  taxYear: number,
  filingStatus: FilingStatus,
): PreferentialBrackets {
  const table = TABLES_BY_YEAR[taxYear];
  if (!table) {
    throw new Error(
      `No preferential-rate brackets loaded for tax year ${taxYear}. Available: ${Object.keys(TABLES_BY_YEAR).join(", ")}.`,
    );
  }
  const brackets = table.byStatus[filingStatus];
  if (!brackets) {
    throw new Error(
      `Filing status "${filingStatus}" has no preferential-rate brackets in the ${taxYear} table.`,
    );
  }
  return brackets;
}
