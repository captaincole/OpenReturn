import { atLeast, sum } from "../../money.js";

/* Line 12: the form says "If zero or less, enter -0-". */
export const netInvestmentIncome = (
  line8: number | undefined,
  line11: number | undefined,
): number => atLeast(0, sum(line8, line11 === undefined ? 0 : -line11));
