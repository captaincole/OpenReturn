import { atLeast } from "../../money.js";

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
