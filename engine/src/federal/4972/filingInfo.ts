import type { LumpSumDistributionFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form4972Lines } from "./form.js";

/*
 * One Form 4972: one plan participant's distributions to one recipient.
 * - figured: the lines are known;
 * - waits: a Part I answer or a named Form 1099-R is missing (missingInputs lists it);
 * - gap: the engine cannot figure the lines (the reason).
 */
export type Form4972Result =
  { kind: "figured"; lines: Form4972Lines } | { kind: "waits" } | { kind: "gap"; reason: string };

export interface Form4972Copy {
  /* The lump-sum fact (retirement.lump_sum_distribution.<slug>). */
  factKey: string;
  /* Whose 1099-Rs they are: the header's name and number. */
  recipient: "taxpayer" | "spouse";
  answers: LumpSumDistributionFactValue;
  result: Form4972Result;
}

export interface Form4972FilingInfo extends BaseFilingInfo {
  /* The one Form 4972 the engine prints; undefined when none files or more than one does. */
  form4972?: Form4972Copy;
  /* Why the printed form's lines are unsupported (more than one copy, a decision with no fact). */
  form4972Gap?: string;
  /* Form 1040 line 16: the tax of every Form 4972; undefined while one waits or has a gap. */
  form4972Tax?: number;
  /* Why the Form 4972 tax cannot be figured. */
  form4972TaxGap?: string;
}
