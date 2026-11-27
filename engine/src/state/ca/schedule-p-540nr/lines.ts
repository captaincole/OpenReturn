/*
 * Schedule P (540NR) Part II lines 25 to 45, 2025: the minimum tax on total
 * AMTI (lines 22 to 24, Schedule P (540)'s rules) at its average rate, on the
 * California part of AMTI (the form face, ca-540nr-sched-p-face-2025::sec::face-part-ii::b01
 * to b04). Pure functions on whole dollars; the bindings (partII.ts) read the
 * lines and call them.
 *
 * The two four-place ratios (line 38, line 42) round the half up, the rule
 * Form 540NR lines 36 and 38 follow (540nr/lines.ts, decision A78): one rule
 * for every four-box ratio of the return (QUESTIONS.md).
 */

import { atLeast, sum } from "../../../money.js";
import { caShare, caTaxRate, prorated } from "../540nr/lines.js";

/* Line 28: "Combine line 25 through line 27"; line 27 prints in parentheses (the form). */
export function californiaAgiForAmt(caAgi: number, nolAdjustment: number, exclusion: number) {
  return caAgi + nolAdjustment - exclusion;
}

/* Line 30: "Combine line 28 and line 29"; line 32: "Subtract line 31 from line 30" (the form). */
export function californiaAmtAgi(line28: number, line29: number, line31: number) {
  return line28 + line29 - line31;
}

/*
 * Line 35: "Combine line 33 and line 34"; line 34 prints in parentheses (the
 * form): the itemized deductions less the ones Part I adds back for AMT.
 */
export function totalAmtItemizedDeductions(itemized: number, includedInPartI: number) {
  return itemized - includedInPartI;
}

/*
 * Line 38: "Divide line 32 by line 37. Do not enter more than 1.0000" (the
 * form): four places, from 0 to 1 (caShare, the Form 540NR line 38 rule).
 */
export function amtItemizedDeductionPercentage(line32: number, line37: number): number {
  return caShare(line32, line37);
}

/* Line 39: "Multiply line 35 by line 38"; line 40: "Subtract line 39 from line 32" (the form). */
export function californiaAmti(line32: number, line35: number, line38: number) {
  return line32 - prorated(line35, line38);
}

/*
 * Line 42: "Divide line 41 by amount from Part I, line 21" (the form), four
 * places. With no AMTI above 0 there is no tentative minimum tax: 0.
 */
export function californiaAmtRate(totalTmt: number, totalAmti: number): number {
  return caTaxRate(totalTmt, totalAmti);
}

/*
 * Line 43: "Multiply line 40 by line 42" (the form). "If line 23 is zero or
 * less, enter -0- on line 23, line 24, and line 43"
 * (ca-540nr-sched-p-inst-2025::sec::line-23::b01). A California AMTI below 0
 * gives no tentative minimum tax, not a negative one (QUESTIONS.md).
 */
export function californiaTmt(line40: number, rate: number, line23: number): number {
  if (line23 <= 0) return 0;
  return atLeast(0, prorated(line40, rate));
}

/* Line 45: "Subtract line 44 from line 43. If zero or less, enter -0-" (the form). */
export function alternativeMinimumTax(californiaTmtAmount: number, regularTax: number): number {
  return atLeast(0, californiaTmtAmount - regularTax);
}

/* What lines 25 to 45 read, all whole dollars (the blind check and the unit tests). */
export interface PartIIInputs {
  /* Line 25: Schedule CA (540NR) Part IV line 1. */
  californiaAgi: number;
  /* Line 26, a positive amount; line 27; line 29 (a to r); line 31. */
  nolAdjustment?: number;
  amtiExclusion?: number;
  californiaAdjustments?: number;
  californiaAmtNol?: number;
  /* Lines 33 and 34: present only when the return itemizes. */
  itemized?: { scheduleCaLine28: number; includedInPartI: number };
  /* Part I line 21, Part II lines 23 and 24 (Schedule P (540)'s rules). */
  totalAmti: number;
  line23: number;
  totalTmt: number;
  /* Line 44: Form 540NR line 37. */
  regularTax: number;
}

export interface PartIILines {
  line28: number;
  line30: number;
  line32: number;
  line35?: number;
  line37?: number;
  line38?: number;
  line39?: number;
  line40: number;
  line42: number;
  line43: number;
  line45: number;
}

/* Lines 28 to 45 in the form's order; lines 33 to 39 only for a return that itemizes. */
export function californiaPartII(inputs: PartIIInputs): PartIILines {
  const line28 = californiaAgiForAmt(
    inputs.californiaAgi,
    sum(inputs.nolAdjustment),
    sum(inputs.amtiExclusion),
  );
  const line30 = line28 + sum(inputs.californiaAdjustments);
  const line32 = californiaAmtAgi(
    line28,
    sum(inputs.californiaAdjustments),
    sum(inputs.californiaAmtNol),
  );
  const itemized = inputs.itemized;
  const line35 = itemized
    ? totalAmtItemizedDeductions(itemized.scheduleCaLine28, itemized.includedInPartI)
    : undefined;
  const line37 = line35 === undefined ? undefined : line35 + inputs.totalAmti;
  const line38 = line37 === undefined ? undefined : amtItemizedDeductionPercentage(line32, line37);
  const prorates = line35 !== undefined && line38 !== undefined;
  const line39 = prorates ? prorated(line35, line38) : undefined;
  const line40 = prorates ? californiaAmti(line32, line35, line38) : line32;
  const line42 = californiaAmtRate(inputs.totalTmt, inputs.totalAmti);
  const line43 = californiaTmt(line40, line42, inputs.line23);
  const line45 = alternativeMinimumTax(line43, inputs.regularTax);
  return { line28, line30, line32, line35, line37, line38, line39, line40, line42, line43, line45 };
}
