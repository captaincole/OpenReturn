import { roundDollars, sum } from "../../../money.js";
import type { FilingStatus } from "../../../values.js";

/*
 * Part II line 29. Federal AGI (Form 540 line 13) above this sends line 28
 * through the Itemized Deductions Worksheet
 * (ca-540-sched-ca-inst-2025::sec::line-29-california-itemized-deductions::b02).
 * Schedule CA and the deductions comparison both read it.
 */
export const LINE_29_FEDERAL_AGI_THRESHOLD = {
  single: 252203,
  married_filing_separately: 252203,
  head_of_household: 378310,
  married_filing_jointly: 504411,
  qualifying_surviving_spouse: 504411,
} as const satisfies Record<FilingStatus, number>;
/* Part II line 24: the 2% floor on job expenses and other miscellaneous deductions (the form). */
export const CA_MISC_FLOOR_RATE = 0.02;
/* Itemized Deductions Worksheet lines 4 and 8 (ca-540-sched-ca-inst-2025::sec::itemized-deductions-worksheet::b01). */
const WORKSHEET_LINE_4_RATE = 0.8;
const WORKSHEET_LINE_8_RATE = 0.06;

/*
 * The Itemized Deductions Worksheet for Part II line 29
 * (ca-540-sched-ca-inst-2025::sec::itemized-deductions-worksheet::b01).
 * Worksheet line 2 adds Schedule A lines 4, 9, 15 and gambling losses in
 * line 16; the engine cannot split gambling losses out of line 16, so a
 * filled line 16 leaves line 29 blank.
 */
export function itemizedDeductionsWorksheet(input: {
  line28: number;
  federalAgi: number;
  threshold: number;
  scheduleALine4: unknown;
  scheduleALine9: unknown;
  scheduleALine15: unknown;
  scheduleALine16: unknown;
}): number | undefined {
  if (input.scheduleALine16 !== undefined) return undefined;
  const line1 = input.line28;
  const line2 = sum(input.scheduleALine4, input.scheduleALine9, input.scheduleALine15);
  const line3 = line1 - line2;
  if (line3 <= 0) return line1;
  const line4 = roundDollars(line3 * WORKSHEET_LINE_4_RATE);
  const line7 = input.federalAgi - input.threshold;
  if (line7 <= 0) return line1;
  const line8 = roundDollars(line7 * WORKSHEET_LINE_8_RATE);
  const line9 = Math.min(line4, line8);
  return line1 - line9;
}

/* Line 29: line 28 at or under the threshold, else the worksheet. */
export function caItemizedLine29(input: {
  line28: number;
  federalAgi: number;
  filingStatus: FilingStatus;
  scheduleALine4: unknown;
  scheduleALine9: unknown;
  scheduleALine15: unknown;
  scheduleALine16: unknown;
}): number | undefined {
  const threshold = LINE_29_FEDERAL_AGI_THRESHOLD[input.filingStatus];
  if (input.federalAgi <= threshold) return input.line28;
  return itemizedDeductionsWorksheet({ ...input, threshold });
}
