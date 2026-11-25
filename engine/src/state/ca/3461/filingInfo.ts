import type { Form461Figures } from "../../../federal/461/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* What FTB 3461's lines read besides Schedule CA; resolve3461Info fills it. */
export interface Form3461Figures {
  /* Line 15: $313,000, or $626,000 on a joint return. */
  threshold: number;
  /*
   * The federal Form 461 sorting of the same amounts: the stated business
   * capital gain and line 8 amount, the Schedule E columns and K-1 items not
   * from a trade or business, and the Part I lines the engine cannot fill.
   */
  federal: Form461Figures;
  /* Line 14b as a positive amount; 0 when none, undefined while the answer waits. */
  carryover?: number;
  /* Line 17's prior adjustments included as income; undefined when not asked or while it waits. */
  priorAdjustments?: number;
  /* Why Part I cannot be read on this return (Form 540NR), else undefined. */
  gap?: string;
}

export interface Form3461FilingInfo extends BaseFilingInfo {
  /* Undefined when FTB 3461 does not file. */
  form3461?: Form3461Figures;
}
