import { atLeast, sum } from "../../money.js";

/* irs-8960-inst-2025::sec::application-to-individuals::b01: line 14 and Who Must File. Not indexed. */
export const NIIT_THRESHOLDS: Record<string, number> = {
  single: 200000,
  head_of_household: 200000,
  married_filing_jointly: 250000,
  qualifying_surviving_spouse: 250000,
  married_filing_separately: 125000,
};

/* Line 12: the form says "If zero or less, enter -0-". */
export const netInvestmentIncome = (
  line8: number | undefined,
  line11: number | undefined,
): number => atLeast(0, sum(line8, line11 === undefined ? 0 : -line11));
