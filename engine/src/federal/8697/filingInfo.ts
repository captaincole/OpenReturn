import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8697Plan } from "./plan.js";

/*
 * The Form 8697 of the return (plan.ts) and the copy being printed. Schedule 2
 * line 17n reads the plan's net interest owed (results.ts).
 */
export interface Form8697FilingInfo extends BaseFilingInfo {
  /* Undefined when the form does not file, or files by decision with no look-back fact yet. */
  form8697?: Form8697Plan;
  form8697CopyIndex?: number;
}
