import { atLeast } from "../../money.js";

/*
 * irs-8959-inst-2025::sec::threshold-amounts-for-additional-medicare-tax::b01, for
 * lines 5, 9 and 15 and Who Must File. Only Part II adjusts them (line 11).
 */
export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<string, number> = {
  single: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
  head_of_household: 200000,
  qualifying_surviving_spouse: 200000,
};

/* Who Must File: Medicare wages on any single Form W-2 (box 5) over this amount. */
export const SINGLE_W2_MEDICARE_WAGES_LIMIT = 200000;

/* Line 6: blank without a threshold on line 5; a blank line 5 is not $0. */
export const excessMedicareWages = (
  line4: number | undefined,
  line5: number | undefined,
): number | undefined => (line5 === undefined ? undefined : atLeast(0, (line4 ?? 0) - line5));
