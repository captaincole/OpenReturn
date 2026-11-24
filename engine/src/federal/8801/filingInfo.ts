import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Lines11To15, Lines16To21, Lines1To10 } from "./lines.js";
import type { PartIIILines } from "./partIII.js";

/*
 * Lines 1–21 and Part III: every one is a 2024 amount, so the resolver figures
 * them from the stated answers. Lines 22–26 read the 2025 return (credit.ts).
 */
export interface Form8801PriorYear {
  upTo10: Lines1To10;
  /* Line 11 when line 10 is above 0 and no 2024 Form 2555 makes it a gap. */
  line11?: number;
  /* Line 12; blank with no 2024 foreign tax credit. */
  line12?: number;
  /* Lines 11–15, when line 10 is above 0 and neither line 11 nor line 12 is a gap. */
  upTo15?: Lines11To15;
  /* Line 14 when line 10 is above 0: 2024 Form 6251 line 10. */
  line14?: number;
  /* Part III when line 11 takes it. */
  partIII?: PartIIILines;
  /* Why line 11 is unsupported. */
  line11Gap?: string;
  /* Why Part III is unsupported: a 2024 Form 2555 with a 2024 capital gain worksheet. */
  partIIIGap?: string;
  /* Why line 12 is unsupported. */
  line12Gap?: string;
  /* Line 15: 0 when line 4 or line 10 is 0; undefined while a gap stands. */
  line15?: number;
  /* Lines 16–21; undefined while a gap stands. */
  partII?: Lines16To21;
}

export interface Form8801FilingInfo extends BaseFilingInfo {
  /* Undefined while an answer lines 1–10 need is missing (missingInputs names it). */
  form8801PriorYear?: Form8801PriorYear;
}
