import type { TrustAccumulationDistributionFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Column, PartI, PartIITotals } from "./lines.js";

/* One Form 4970's lines. Part II is undefined when line 8 has no year. */
export interface Form4970Lines {
  partI: PartI;
  /* Line 13, columns (a) 2024 to (e) 2020. */
  line13?: number[];
  /* Lines 14 to 23, the three computation years in line 13's order. */
  columns?: Column[];
  totals?: PartIITotals;
  /* The partial tax for Schedule 2 line 17l: line 28, or 0 with no year on line 8. */
  tax?: number;
}

/*
 * One trust's Form 4970:
 * - figured: the lines are known; partIIGap names why lines 17 to 28 are not,
 *   line28Gap why line 28 is not;
 * - waits: an answer is missing (missingInputs lists it);
 * - gap: the engine cannot figure the form (the reason).
 */
export type Form4970Result =
  | { kind: "figured"; lines: Form4970Lines; partIIGap?: string; line28Gap?: string }
  | { kind: "waits"; missing: string[] }
  | { kind: "gap"; reason: string };

export interface Form4970Copy {
  /* The trust fact (trust_accumulation_distribution.<slug>). */
  factKey: string;
  answers: TrustAccumulationDistributionFactValue;
  result: Form4970Result;
}

export interface Form4970FilingInfo extends BaseFilingInfo {
  /* The one Form 4970 the engine prints; undefined when none files or more than one does. */
  form4970?: Form4970Copy;
  /* Why the printed form's lines are unsupported (more than one trust, a decision with no fact). */
  form4970Gap?: string;
  /* Header G: the number of trusts whose Form 4970 files. */
  form4970TrustCount?: number;
  /* Schedule 2 line 17l: the partial tax of the Form 4970; undefined while it waits or has a gap. */
  form4970Tax?: number;
  /* Why Schedule 2 line 17l cannot be figured (a gap, or a foreign trust's Form 3520). */
  form4970TaxGap?: string;
}
