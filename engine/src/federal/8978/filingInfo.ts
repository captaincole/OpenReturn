import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8978Plan } from "./plan.js";

/*
 * The Forms 8978 of the return (plan.ts) and the copy being printed. Form 1040
 * line 16, Schedule 3 line 6l, Schedule 2 line 17z and Form 6251 line 10 read
 * the plan's line 14 total (receivers.ts).
 */
export interface Form8978FilingInfo extends BaseFilingInfo {
  /* Undefined when no Form 8986 belongs to 2025, or the explicit decision turns the form off. */
  form8978?: Form8978Plan;
  form8978CopyIndex?: number;
}
