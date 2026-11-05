import { atLeast } from "../../money.js";

/* 2025 QBI threshold and phase-in range (8995-A lines 21 and 23). */
export const QBI_LIMITS: Record<string, { threshold: number; range: number }> = {
  single: { threshold: 197300, range: 50000 },
  married_filing_separately: { threshold: 197300, range: 50000 },
  head_of_household: { threshold: 197300, range: 50000 },
  qualifying_surviving_spouse: { threshold: 197300, range: 50000 },
  married_filing_jointly: { threshold: 394600, range: 100000 },
};

/*
 * Line 34 net capital gain: the smaller of Schedule D lines 15 and 16, if
 * both are gains. Without Schedule D, 1040 line 7a.
 */
export function netCapitalGain(
  scheduleDLine15: number | undefined,
  scheduleDLine16: number | undefined,
  form1040Line7a: number | undefined,
): number {
  if (scheduleDLine16 === undefined) return atLeast(0, form1040Line7a);
  if (scheduleDLine15 === undefined) return 0;
  return atLeast(0, Math.min(scheduleDLine15, scheduleDLine16));
}
